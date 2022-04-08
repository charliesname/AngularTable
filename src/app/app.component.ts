import { Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

interface Car {
  vin: string,
  year: string,
  color: string,
  brand: string
}

interface AppStore {
  list: Car[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  list$: Observable<Car[]>

  constructor(private store: Store<AppStore>) {
    this.list$ = this.store.select('list')
  }

  initList() {
    this.store.dispatch({type: 'INIT'})
  }
}

