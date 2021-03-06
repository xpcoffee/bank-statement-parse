import { DateTime } from "luxon";
import { Statement, Transaction, Banks, ParsingFunction, Currencies } from "../types";
import hash from "../hash";
import { tryExtractMessage } from "../errors";

/**
 * Function with which to parse a line from a downloaded FNB statement.
 *
 * @param line - the line to parse
 * @param memo - the statement with which the parsed data should be combined
 * @returns statement - the statement with more data parsed in
 */
const parse: ParsingFunction = (memo: Statement, line: string): Statement => {
  const statement = Object.assign({}, memo);

  try {
    switch (getSection(line)) {
      case StatementSection.Account:
        const [header, accountNumber, accountNickname] = line.split(",");
        statement.account = accountNumber.trim();
        statement.bank = Banks.FNB;
        break;

      case StatementSection.Transaction:
        statement.transactions.push(transactionFromFnbLineSections(line));
        break;
    }
  } catch (e) {
    const message = tryExtractMessage(e);
    message && statement.parsingErrors.push(message);
  }

  return statement;
};

function transactionFromFnbLineSections(line: string): Transaction {
  const [date, amount, balance, description] = line.split(",");

  return {
    description: description.trim(),
    amount: Number(amount),
    currency: Currencies.SouthAfricaRand,
    timeStamp: toTimestamp(date),
    hash: hash(line),
    balance: Number(balance),
  };
}

function toTimestamp(dateString: string): string {
  const parsedDate = DateTime.fromFormat(dateString, "yyyy/MM/dd");
  if (parsedDate.invalidReason) {
    throw `Could not parse "${dateString}" into timestamp. ${parsedDate.invalidExplanation}`;
  }
  return parsedDate.toISO({ suppressMilliseconds: true });
}

enum StatementSection {
  Name,
  Account,
  Balance,
  Transaction,
  Unknown,
}

const getSection = (line: string) => {
  if (line.startsWith("Name")) {
    return StatementSection.Name;
  }
  if (line.startsWith("Account")) {
    return StatementSection.Account;
  }
  if (line.startsWith("Balance")) {
    return StatementSection.Balance;
  }

  const firstToken = line.split(",", 1)[0];
  const transactionDate = Date.parse(firstToken);
  if (!isNaN(transactionDate)) {
    return StatementSection.Transaction;
  }

  return StatementSection.Unknown;
};

const fileType = "FNB-TransactionHistory" as const;
export default {
  fileType,
  parse,
};
