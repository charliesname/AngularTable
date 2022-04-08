import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { debounceTime, fromEvent, Observable, Subject, takeUntil } from 'rxjs';
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

interface Subitem {
  nr: number,
  year: number,
  color: string,
}

interface SubitemColumns {
  field: string,
  header: string,
  type: string,
  width: number,
  order: number
}

interface LazyLoadEventCustom {
  first: number,
  rows: number
}

@Component({
  selector: 'app-myTable',
  templateUrl: './myTable.component.html',
  styleUrls: ['./myTable.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MyTableComponent implements OnInit, AfterViewInit {

  @ViewChild('myTable') myTable: ElementRef<HTMLDivElement>;

  @Input() myList = Array<Item>();

  pageSummary: String = '';

  itemColumnsAll: ItemColumns[] = Array<ItemColumns>();
  itemColumns: ItemColumns[] = Array<ItemColumns>();

  items: Item[] = Array<Item>();
  itemsFiltered: Item[] = Array<Item>();
  itemsDistinctByColumn: string[][] = Array<string[]>();
  itemsDistinctByColumnFiltered: string[][] = Array<string[]>();

  subtable: Subitem[] = Array<Subitem>();
  subtableLast: Subitem[] = Array<Subitem>();
  subtableColumns: SubitemColumns[] = Array<SubitemColumns>();
  
  itemsVirtual: Item[] = Array<Item>();
  rowHeight: number = 30;
  rowLoad: number = 100;

  isLoading: boolean = false;
  isLoadingSubtable: boolean = false;

  lastSort: string = '';
  lastSortOrder: number = 1;
  openRow: number = -1;
  openRowLast: number = -1;

  destroy = new Subject();
  destroy$ = this.destroy.asObservable();

  currentFirstRow: number = -1;
  preBodyHeight: number = 0;
  postBodyHeight: number = 0;

  isContextmenuOpen: boolean = false;
  contextmenuX: number = 0;
  contextmenuY: number = 0;
  contextmenuItem: Item | undefined;

  constructor(private carService: CarService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {

    this.itemColumnsAll = [
        {field: 'nr', header: 'Nr', type: 'numeric', width: 100, order: 1},
        {field: 'year', header: 'År', type: 'numeric', width: 200, order: 2},
        {field: 'color', header: 'Färg', type: 'text', width: 200, order: 3}
    ];
    this.itemColumns = [...this.itemColumnsAll];

    this.subtableColumns = [
        {field: 'nr', header: 'Nr', type: 'numeric', width: 50, order: 1},
        {field: 'year', header: 'År', type: 'numeric', width: 100, order: 2},
        {field: 'color', header: 'Färg', type: 'text', width: 100, order: 3}
    ];

    this.lastSort = this.itemColumnsAll[0].field;

    //TODO
    let totalGeneratedRows = 10005;

    this.items = Array.from({length: totalGeneratedRows}).map(() => this.carService.generateCar());
    this.itemsFiltered = [...this.items];

    let mapper = new Map<string, Map<string, string>>();

    for(let i = 0; i < this.itemColumns.length; i++) {
      mapper.set(this.itemColumns[i].field, new Map<string, string>());
    }

    for(let i = 0; i < this.items.length; i++) {
      let entries = Object.entries(this.items[i]);
      for(let j = 0; j < entries.length; j++) {
        mapper.get(entries[j][0])?.set(entries[j][1].toString(), '');
      }
    }


    for(let i = 0; i < this.itemColumns.length; i++) {
      let column = this.itemColumns[i].field;
      this.itemsDistinctByColumn[i] = Array.from(mapper.get(column)?.keys() ?? []);
      this.itemsDistinctByColumn[i].sort();
      this.itemsDistinctByColumnFiltered[i] = [];
    }
    //this.itemsDistinctByColumnFiltered = [...this.itemsDistinctByColumn];

    this.resetVirtualArray();
    this.setPreAndPostBodyHeight();
  }

  getContextMenuOptions() {
    return 'Skadeutveckling;Navigate;Edit';
  }

  onRightClick(event: MouseEvent, car: Item ) {
    this.contextmenuItem = car;
    this.contextmenuX = event.clientX;
    this.contextmenuY = event.clientY;
    this.isContextmenuOpen = true;
    const menuHeight = this.getContextMenuOptions().split(';').length;
    const maxY = window.innerHeight - ( menuHeight * 30);
    if ( this.contextmenuY > maxY ) {
      this.contextmenuY = maxY;
    }
  }

  hideContextMenu() {
    this.isContextmenuOpen = false;
  }

  handleContextMenuSelection( menuselection: string) {
    if ( menuselection === 'Skadeutveckling') {
      this.openThisRow(this.contextmenuItem!)
    } else if ( menuselection === 'Navigate') {
      //TODO
    }
    this.hideContextMenu();
  }

  resetVirtualArray() {
    this.itemsVirtual = Array.from({length: Math.min(this.rowLoad * 3, this.itemsFiltered.length)});
    this.currentFirstRow = -1;
    this.openRow = -1;
  }

  setPreAndPostBodyHeight() {
    this.preBodyHeight = this.currentFirstRow * this.rowHeight;
    this.postBodyHeight = Math.max(0, (this.itemsFiltered.length - this.itemsVirtual.length - this.currentFirstRow)  * this.rowHeight);

    console.log('preBodyHeight: ' + this.preBodyHeight);
    console.log('postBodyHeight: ' + this.postBodyHeight);
  }

	ngOnDestroy(): void {
    this.destroy.next(0);
	}

  ngAfterViewInit() {
    console.log(this.myTable);
    this.lazyLoad({
        first: 0,
        rows: this.rowLoad * 3,
      } as LazyLoadEventCustom);

    fromEvent(this.myTable.nativeElement, 'scroll')
    .pipe(takeUntil(this.destroy$), debounceTime(100))
    .subscribe((e: Event) => this.onScroll(this.getYPosition(e)));
  }

  getYPosition(e: Event): number {
    return (e.target as Element).scrollTop;
  }
  
  onScroll(scrollPos: number) {

    setTimeout(() => {
      let e = {
        first: Math.max(0, Math.floor(scrollPos / this.rowHeight / this.rowLoad) * this.rowLoad - this.rowLoad),
        rows: this.rowLoad * 3
      };
      this.lazyLoad(e as LazyLoadEventCustom);
    }, 0);
  }

  openThisRow(item: Item) {

    this.openRowLast = this.openRow;

    if (this.openRow == item.nr) {
      this.subtableLast = this.subtable;
      this.openRow = -1;
    }
    else {
      this.isLoadingSubtable = true;
      this.openRow = item.nr;
      this.subtableLast = this.subtable;
      this.subtable = [];

      setTimeout(() => {

        //TODO - Ladda in data i subtabellen
        this.subtable = Array.from({length: 1 + Math.floor(Math.random() * 30)}).map(() => this.carService.generateCar());

        this.myTable.nativeElement.scroll({
          top: (this.currentFirstRow + this.itemsVirtual.indexOf(item)) * this.rowHeight, 
          left: 0, 
          behavior: 'smooth'
        });

        this.isLoadingSubtable = false;
        this.openRowLast = -1;
      }, 500);
    }
  }

  sortBy(event: any, column: string) {

    this.isLoading = true;

    if (this.lastSort == column) {
      this.lastSortOrder = -this.lastSortOrder;
    }
    else {
      this.lastSort = column;
      this.lastSortOrder = 1;
    }

    console.log(column);
    this.myTable.nativeElement.scrollTop = 0;
    switch (this.itemColumnsAll.find(i => i.field === column)?.type)
    {
      case 'numeric':
        if (this.lastSortOrder == 1)
          this.itemsFiltered.sort((a: any, b: any) => a[column] - b[column]);
        else
          this.itemsFiltered.sort((a: any, b: any) => b[column] - a[column]);
        break;

      case 'text':
        if (this.lastSortOrder == 1)
          this.itemsFiltered.sort((a: any, b: any) => a[column].localeCompare(b[column]));
        else
          this.itemsFiltered.sort((a: any, b: any) => b[column].localeCompare(a[column]));
        break;
    }
    
    this.resetVirtualArray();

    this.lazyLoad({
        first: 0,
        rows: this.rowLoad * 2,
      } as LazyLoadEventCustom);
  }

  onFilter() {
    this.resetVirtualArray();

    console.log(this.itemsDistinctByColumnFiltered);

    this.itemsFiltered = this.items;

    if (this.itemsDistinctByColumnFiltered[0].length > 0)
      this.itemsFiltered = this.itemsFiltered.filter(v => this.itemsDistinctByColumnFiltered[0].includes(v.nr.toString()));

    if (this.itemsDistinctByColumnFiltered[1].length > 0)
      this.itemsFiltered = this.itemsFiltered.filter(v => this.itemsDistinctByColumnFiltered[1].includes(v.year.toString()));

    if (this.itemsDistinctByColumnFiltered[2].length > 0)
      this.itemsFiltered = this.itemsFiltered.filter(v => this.itemsDistinctByColumnFiltered[2].includes(v.color.toString()));

    this.lazyLoad({
        first: 0,
        rows: this.rowLoad * 2,
      } as LazyLoadEventCustom);
  }

  onColumnsChange(event: any) {
    this.itemColumns.sort((a: ItemColumns, b: ItemColumns) => a.order - b.order)
  }


  lazyLoad(event: LazyLoadEventCustom) {

    if (this.currentFirstRow == event.first) {
      return;
    }

    this.isLoading = true;

    setTimeout(() => {      

      let scrollStart = this.myTable.nativeElement.scrollTop;
      this.currentFirstRow = event.first;
    
      let itemsLoaded = this.itemsFiltered.slice(event.first, event.first + event.rows);
      //Array.prototype.splice.apply(this.virtualCars, [event.first, loadedCars.length, ...loadedCars]);
      this.itemsVirtual = [...itemsLoaded];

      this.pageSummary = 'Visar ' + this.itemsFiltered.length + ' av ' + this.items.length + ' rader';

      setTimeout(() => {
        this.setPreAndPostBodyHeight();
        this.isLoading = false;        

        setTimeout(() => {
          let scroll = this.myTable.nativeElement.scrollTop;
          console.log('scroll: ' + scrollStart + ' -> ' + scroll + ' (' + (scrollStart - scroll) + ')');

          // När man skrollar till botten av tabellen kan skrollen hoppa upp
          if (scroll - scrollStart !== 0) {
            this.myTable.nativeElement.scrollTop = Math.max(scrollStart, scroll);
          }
        }, 0);
      }, 0);
    }, 150);
  }
}