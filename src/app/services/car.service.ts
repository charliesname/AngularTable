import { Injectable } from '@angular/core';

interface Car {
  nr: number,
  year: number,
  color: string
}

@Injectable({
  providedIn: 'root'
})
export class CarService {

  count: number = 1;

  constructor() { }

  generateCar() : Car {
    return {
      nr: this.count++,
      year: 1950 + Math.round(Math.random() * 70),
      color: 'Färgkod ' + Math.round(Math.random() * 5)
    }
  }
}
