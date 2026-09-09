/** Bouquet identity, rather than a duplicated counter, is the source of truth. */
export class BouquetInventory {
  private ids = new Set<string>();
  private delivered = 0;
  get collected(): string[] {
    return [...this.ids];
  }
  get total(): number {
    return this.ids.size;
  }
  get gifted(): number {
    return this.delivered;
  }
  get available(): number {
    return this.total - this.delivered;
  }
  has(id: string): boolean {
    return this.ids.has(id);
  }
  collect(id: string): boolean {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    return true;
  }
  give(): boolean {
    if (!this.available) return false;
    this.delivered++;
    return true;
  }
  reset(): void {
    this.ids.clear();
    this.delivered = 0;
  }
}
