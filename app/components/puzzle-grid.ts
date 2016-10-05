import {Component, Input} from '@angular/core';
import {Grid} from '../lib/grid';

@Component({
    selector: 'puzzle-grid',
    template: `
        <div class="puzzle" *ngIf="grid">
          <div class="puzzle-row" *ngFor="let row of grid.cells">
            <div class="puzzle-square" *ngFor="let cell of row"
                  (click)="puzzleSquareClick(cell)" [class.filled]="cell.filled">
              <span class="puzzle-number">{{cell.number}}&nbsp;</span>
              <input *ngIf="!cell.filled"
                    class="puzzle-value text-uppercase {{cell.autocompleted ? 'autocompleted' : ''}}"
                    (keyup)="onGridKeyUp($event, cell)"
                    [(ngModel)]="cell.value">
            </div>
          </div>
        </div>
      `,
})
export class PuzzleGridComponent {
  @Input() grid: Grid;
  constructor() {
  }
}
