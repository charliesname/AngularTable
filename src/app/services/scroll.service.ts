// https://fireflysemantics.medium.com/observing-whether-the-element-is-being-scrolled-up-with-rxjs-aba1b16e47c4

import { Injectable, OnDestroy } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { fromEvent, of, Observable } from 'rxjs'
import { switchMap, pairwise, debounceTime, distinctUntilChanged, map } from 'rxjs/operators'

type scrollPosition = ()=>[number, number];

@Injectable({
  providedIn: 'root'
})
export class ScrollService implements OnDestroy {
  constructor() {}
  ngOnDestroy() {}

  bindScroll(vc:ViewportScroller) {
    let sp:scrollPosition = vc.getScrollPosition.bind(vc)
    this.scrollingUp(window, 20, sp ).
    subscribe((v) => console.log(v))
  }

    /**
   * @param scrollable The element being scrolled
   * @param debounceMS The number of milliseconds to debounce scroll events
   * @param sp The function returning the scroll position coordinates.
   * @return A boolean valued observable indicating whether the element is scrolling up or down
   */
  scrollingUp(
    scrollable: any, 
    debounceMS: number, 
    sp: scrollPosition): Observable<boolean> {
    return fromEvent(scrollable, 'scroll').pipe(
      debounceTime(debounceMS), 
      distinctUntilChanged(), 
      map(v => sp()), 
      pairwise(), 
      switchMap(p => {
      const y1 = p[0][1]
      const y2 = p[1][1]
      return y1 - y2 > 0 ? of(false) : of(true)
    }))
  }
}

