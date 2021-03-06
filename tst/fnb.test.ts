import { validateTransaction } from "@xpcoffee/bank-schema";
import { getEmptyStatement } from "../src/statement";
import definition, { FnbStatement } from "../src/statement-definitions/fnbDefault";
import { Currencies } from "../src/types";

describe("fnb", () => {
  it("parses a transaction from a statement", () => {
    const transactionLine = `5,35,'25 Sep',"foo","bar","baz",150,1000`;

    const statement: FnbStatement = getEmptyStatement();
    statement.startDate = new Date("2019");
    statement.endDate = new Date("2020");

    const parsedTransaction = definition.parse(statement, transactionLine).transactions[0];

    expect(statement.parsingErrors).toEqual([]);
    expect(validateTransaction(parsedTransaction).errors).toEqual([]);
    expect(parsedTransaction.amount).toEqual(150);
    expect(parsedTransaction.currency).toEqual(Currencies.SouthAfricaRand);
    expect(parsedTransaction.description).toEqual("bar");
    expect(parsedTransaction.timeStamp).toEqual("2019-09-25T00:00:00+02:00");
  });

  it("infers the date within the statement's date range", () => {
    const statement: FnbStatement = getEmptyStatement();
    statement.startDate = new Date("2019-01-12");
    statement.endDate = new Date("2020-01-11");

    // this transaction could not have happened in 2019 - that's before the start of the statement date range
    const transactionLine = `5,35,'2 Jan',"foo","bar","baz",150,1000`;

    const parsedTransaction = definition.parse(statement, transactionLine).transactions[0];

    expect(statement.parsingErrors).toEqual([]);
    expect(parsedTransaction.timeStamp).toEqual("2020-01-02T00:00:00+02:00");
  });
});
