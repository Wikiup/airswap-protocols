// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class DelegateFactory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save DelegateFactory entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save DelegateFactory entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("DelegateFactory", id.toString(), this);
  }

  static load(id: string): DelegateFactory | null {
    return store.get("DelegateFactory", id) as DelegateFactory | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }
}

export class DelegateContract extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save DelegateContract entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save DelegateContract entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("DelegateContract", id.toString(), this);
  }

  static load(id: string): DelegateContract | null {
    return store.get("DelegateContract", id) as DelegateContract | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get factory(): string {
    let value = this.get("factory");
    return value.toString();
  }

  set factory(value: string) {
    this.set("factory", Value.fromString(value));
  }

  get swap(): Bytes {
    let value = this.get("swap");
    return value.toBytes();
  }

  set swap(value: Bytes) {
    this.set("swap", Value.fromBytes(value));
  }

  get indexer(): Bytes {
    let value = this.get("indexer");
    return value.toBytes();
  }

  set indexer(value: Bytes) {
    this.set("indexer", Value.fromBytes(value));
  }

  get owner(): Bytes {
    let value = this.get("owner");
    return value.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get tradeWallet(): Bytes {
    let value = this.get("tradeWallet");
    return value.toBytes();
  }

  set tradeWallet(value: Bytes) {
    this.set("tradeWallet", Value.fromBytes(value));
  }
}

export class Rule extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Rule entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Rule entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Rule", id.toString(), this);
  }

  static load(id: string): Rule | null {
    return store.get("Rule", id) as Rule | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get delegate(): string {
    let value = this.get("delegate");
    return value.toString();
  }

  set delegate(value: string) {
    this.set("delegate", Value.fromString(value));
  }

  get owner(): Bytes {
    let value = this.get("owner");
    return value.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get signerToken(): Bytes {
    let value = this.get("signerToken");
    return value.toBytes();
  }

  set signerToken(value: Bytes) {
    this.set("signerToken", Value.fromBytes(value));
  }

  get senderToken(): Bytes {
    let value = this.get("senderToken");
    return value.toBytes();
  }

  set senderToken(value: Bytes) {
    this.set("senderToken", Value.fromBytes(value));
  }

  get maxSenderAmount(): BigInt {
    let value = this.get("maxSenderAmount");
    return value.toBigInt();
  }

  set maxSenderAmount(value: BigInt) {
    this.set("maxSenderAmount", Value.fromBigInt(value));
  }

  get priceCoef(): BigInt {
    let value = this.get("priceCoef");
    return value.toBigInt();
  }

  set priceCoef(value: BigInt) {
    this.set("priceCoef", Value.fromBigInt(value));
  }

  get priceExp(): BigInt {
    let value = this.get("priceExp");
    return value.toBigInt();
  }

  set priceExp(value: BigInt) {
    this.set("priceExp", Value.fromBigInt(value));
  }
}