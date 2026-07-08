import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import {
  PaymentStatus as DbPaymentStatus,
  Prisma,
  TipMode as DbTipMode,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { BillState, PaymentStatus, TipMode } from "@/lib/types";
import { parseBillForCloud } from "./validation";

const billInclude = {
  people: true,
  items: {
    include: {
      shares: true,
    },
  },
} satisfies Prisma.BillInclude;

type BillRecord = Prisma.BillGetPayload<{ include: typeof billInclude }>;

export type OnlineBillResult = {
  bill: BillState;
  shareId: string;
  editToken: string;
};

export async function createOnlineBill(value: unknown): Promise<OnlineBillResult> {
  const bill = parseBillForCloud(value);
  const shareId = nanoid(12);
  const editToken = randomBytes(32).toString("base64url");
  const editTokenHash = hashEditToken(editToken);

  const created = await prisma.$transaction(async (tx) => {
    const dbBill = await tx.bill.create({
      data: {
        title: bill.title,
        date: toDate(bill.date),
        serviceChargePercent: bill.serviceChargePercent,
        tipMode: toDbTipMode(bill.tipMode),
        tipAmount: bill.tipAmount,
        tipPercent: bill.tipPercent,
        discountAmount: bill.discountAmount,
        publicShareId: shareId,
        editTokenHash,
      },
    });

    await writeBillRelations(tx, dbBill.id, bill);
    await updatePaidByPerson(tx, dbBill.id, bill.paidById);

    return tx.bill.findUniqueOrThrow({
      where: { id: dbBill.id },
      include: billInclude,
    });
  });

  return {
    bill: fromDbBill(created),
    shareId,
    editToken,
  };
}

export async function getBillByShareId(shareId: string): Promise<BillState | null> {
  const bill = await prisma.bill.findUnique({
    where: { publicShareId: shareId },
    include: billInclude,
  });

  return bill ? fromDbBill(bill) : null;
}

export async function getEditableBill(
  shareId: string,
  editToken: string,
): Promise<BillState | null> {
  const bill = await prisma.bill.findUnique({
    where: { publicShareId: shareId },
    include: billInclude,
  });

  if (!bill || !isValidEditToken(editToken, bill.editTokenHash)) return null;

  return fromDbBill(bill);
}

export async function updateOnlineBill(
  shareId: string,
  editToken: string,
  value: unknown,
): Promise<BillState | null> {
  const nextBill = parseBillForCloud(value);
  const existing = await prisma.bill.findUnique({
    where: { publicShareId: shareId },
    select: { id: true, editTokenHash: true },
  });

  if (!existing || !isValidEditToken(editToken, existing.editTokenHash)) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.bill.update({
      where: { id: existing.id },
      data: { paidByPersonId: null },
    });

    await tx.billItemShare.deleteMany({
      where: { item: { billId: existing.id } },
    });
    await tx.billItem.deleteMany({ where: { billId: existing.id } });
    await tx.person.deleteMany({ where: { billId: existing.id } });

    await writeBillRelations(tx, existing.id, nextBill);
    await updatePaidByPerson(tx, existing.id, nextBill.paidById);

    return tx.bill.update({
      where: { id: existing.id },
      data: {
        title: nextBill.title,
        date: toDate(nextBill.date),
        serviceChargePercent: nextBill.serviceChargePercent,
        tipMode: toDbTipMode(nextBill.tipMode),
        tipAmount: nextBill.tipAmount,
        tipPercent: nextBill.tipPercent,
        discountAmount: nextBill.discountAmount,
      },
      include: billInclude,
    });
  });

  return fromDbBill(updated);
}

function hashEditToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isValidEditToken(token: string, hash: string): boolean {
  if (!token) return false;

  return hashEditToken(token) === hash;
}

async function updatePaidByPerson(
  tx: Prisma.TransactionClient,
  billId: string,
  paidByClientId: string,
) {
  const paidByPerson = paidByClientId
    ? await tx.person.findUnique({
        where: {
          billId_clientId: {
            billId,
            clientId: paidByClientId,
          },
        },
        select: { id: true },
      })
    : null;

  await tx.bill.update({
    where: { id: billId },
    data: { paidByPersonId: paidByPerson?.id ?? null },
  });
}

async function writeBillRelations(
  tx: Prisma.TransactionClient,
  billId: string,
  bill: BillState,
) {
  const personIdByClientId = new Map<string, string>();
  const itemIdByClientId = new Map<string, string>();

  for (const person of bill.people) {
    const created = await tx.person.create({
      data: {
        clientId: person.id,
        billId,
        name: person.name,
        paymentStatus: toDbPaymentStatus(
          bill.paymentStatuses[person.id] ?? "unpaid",
        ),
      },
      select: { id: true },
    });

    personIdByClientId.set(person.id, created.id);
  }

  for (const item of bill.items) {
    const created = await tx.billItem.create({
      data: {
        clientId: item.id,
        billId,
        name: item.name,
        price: item.price,
      },
      select: { id: true },
    });

    itemIdByClientId.set(item.id, created.id);
  }

  const shares = bill.items.flatMap((item) => {
    const itemId = itemIdByClientId.get(item.id);

    if (!itemId) return [];

    return item.sharedBy.flatMap((personClientId) => {
      const personId = personIdByClientId.get(personClientId);

      return personId ? [{ itemId, personId }] : [];
    });
  });

  if (shares.length > 0) {
    await tx.billItemShare.createMany({ data: shares });
  }
}

function fromDbBill(bill: BillRecord): BillState {
  const personClientIdById = new Map(
    bill.people.map((person) => [person.id, person.clientId]),
  );
  const paidByClientId = bill.paidByPersonId
    ? personClientIdById.get(bill.paidByPersonId)
    : "";

  return {
    title: bill.title,
    date: bill.date ? bill.date.toISOString().slice(0, 10) : "",
    paidById: paidByClientId ?? "",
    people: bill.people.map((person) => ({
      id: person.clientId,
      name: person.name,
    })),
    items: bill.items.map((item) => ({
      id: item.clientId,
      name: item.name,
      price: item.price,
      sharedBy: item.shares
        .map((share) => personClientIdById.get(share.personId))
        .filter((personId): personId is string => Boolean(personId)),
    })),
    serviceChargePercent: bill.serviceChargePercent,
    tipMode: fromDbTipMode(bill.tipMode),
    tipAmount: bill.tipAmount,
    tipPercent: bill.tipPercent,
    discountAmount: bill.discountAmount,
    paymentStatuses: Object.fromEntries(
      bill.people.map((person) => [
        person.clientId,
        fromDbPaymentStatus(person.paymentStatus),
      ]),
    ),
  };
}

function toDate(value: string): Date | null {
  if (!value) return null;

  return new Date(`${value}T00:00:00.000Z`);
}

function toDbTipMode(mode: TipMode): DbTipMode {
  return mode === "percent" ? DbTipMode.PERCENT : DbTipMode.AMOUNT;
}

function fromDbTipMode(mode: DbTipMode): TipMode {
  return mode === DbTipMode.PERCENT ? "percent" : "amount";
}

function toDbPaymentStatus(status: PaymentStatus): DbPaymentStatus {
  return status === "paid" ? DbPaymentStatus.PAID : DbPaymentStatus.UNPAID;
}

function fromDbPaymentStatus(status: DbPaymentStatus): PaymentStatus {
  return status === DbPaymentStatus.PAID ? "paid" : "unpaid";
}
