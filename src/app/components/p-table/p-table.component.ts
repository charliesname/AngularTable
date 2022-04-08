import { Component, OnInit } from '@angular/core';
import { SortEvent, SortMeta } from 'primeng/api';
import { CarService } from 'src/app/services/car.service';

interface Item {
  nr: number,
  year: number,
  color: string,
}

interface ItemColumns {
  field: string,
  header: string,
  type: string,
  width: number,
  order: number
}

interface MultiSortMetaObject {
  sortMeta: SortMeta[];
}

@Component({
  selector: 'app-p-table',
  templateUrl: './p-table.component.html',
  styleUrls: ['./p-table.component.scss']
})
export class PTableComponent implements OnInit {

  itemColumns: ItemColumns[] = Array<ItemColumns>();
  items: Item[] = Array<Item>();
  multiSortMeta: MultiSortMetaObject = {sortMeta: [{field: 'nr', order: 1}, {field: 'year', order: -1}]};

  constructor(private carService: CarService) { }

  ngOnInit(): void {

    this.itemColumns = [
      {field: 'nr', header: 'Nr', type: 'numeric', width: 100, order: 1},
      {field: 'year', header: 'År', type: 'numeric', width: 200, order: 2},
      {field: 'color', header: 'Färg', type: 'text', width: 200, order: 3}
    ];

    this.items = Array.from({length: 50}).map(() => this.carService.generateCar());

    Object.freeze(this.multiSortMeta.sortMeta);
  }

  sort(e: SortEvent): void {
    console.log(e);

    if (e.multiSortMeta !== undefined) {
      for(let i = e.multiSortMeta?.length - 1; i >= 0; i--)
      {
        let field = e.multiSortMeta[i].field;

        switch (typeof this.items[0][field as keyof Item]) {
          case 'string':
            if (e.multiSortMeta[i].order == 1)
              e.data?.sort((a: Item, b: Item) =>
                a[field as keyof Item].toString().localeCompare(
                b[field as keyof Item].toString()));
            else
              e.data?.sort((a: Item, b: Item) =>
                b[field as keyof Item].toString().localeCompare(
                a[field as keyof Item].toString()));
            break;
            
          case 'number':
           if (e.multiSortMeta[i].order == 1)
              e.data?.sort((a: Item, b: Item) =>
                (a[field as keyof Item] as number) -
                (b[field as keyof Item] as number));
            else
              e.data?.sort((a: Item, b: Item) =>
                (b[field as keyof Item] as number) -
                (a[field as keyof Item] as number));
            break;
        }
      }
      this.items = e.data as Item[];
    }

    if (e.multiSortMeta !== undefined)
      this.multiSortMeta.sortMeta = e.multiSortMeta;
  }

  onSort(): void {
    console.log(this.multiSortMeta.sortMeta);
    //this.multiSortMeta.sortMeta.push({field: 'color', order: 1})
  }
}
