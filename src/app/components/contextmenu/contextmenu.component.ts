//src: https://stackoverflow.com/questions/45702435/how-to-angular-4-context-menu
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-contextmenu',
  templateUrl: './contextmenu.component.html',
  styleUrls: ['./contextmenu.component.scss']
})
export class ContextmenuComponent implements OnInit {

  constructor() { }

  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() menuitems: string = '';
  theMenuItems: string[] = [];
  @Output() menuItemSelected = new EventEmitter();

  ngOnInit() {
      this.theMenuItems = this.menuitems.split(';');
  }

  outputSelectedMenuItem( menuitem: string) {
      this.menuItemSelected.emit(menuitem);
  }
}
