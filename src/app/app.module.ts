import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './reducers';
import { MyTableComponent } from './components/myTable/myTable.component';

import { TableModule } from 'primeng/table';
import {MultiSelectModule} from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { ContextmenuComponent } from './components/contextmenu/contextmenu.component';
import { PTableComponent } from './components/p-table/p-table.component';

@NgModule({
  declarations: [
    AppComponent,
    MyTableComponent,
    ContextmenuComponent,
    PTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    StoreModule.forRoot(reducers, {
      metaReducers
    }),
    TableModule,
    MultiSelectModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
