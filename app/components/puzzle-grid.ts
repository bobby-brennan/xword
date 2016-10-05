import {Component, Input} from '@angular/core';
import {Grid, Cell} from '../lib/grid';
declare let $: any;
@Component({
    selector: 'puzzle-grid',
    template: `
        <div class="puzzle" *ngIf="grid">
          <div class="puzzle-rows pull-left">
            <div class="puzzle-row" *ngFor="let row of grid.cells">
              <div class="puzzle-square" *ngFor="let cell of row"
                    (click)="puzzleSquareClick(cell)" [class.filled]="cell.filled">
                <span class="puzzle-number">{{cell.number}}&nbsp;</span>
                <input *ngIf="!cell.filled"
                      class="puzzle-value text-uppercase {{cell.autocompleted ? 'autocompleted' : ''}}"
                      (keyup)="onGridKeyUp($event, cell)"
                      (focus)="activeClues = grid.getCluesForCell(cell)"
                      [(ngModel)]="cell.value">
              </div>
            </div>
          </div>
          <div class="active-clues" *ngIf="activeClues">
            <h4>{{activeClues.across.number}}. Across</h4>
            <p>{{activeClues.across.prompt || '(No clue set)' }}</p>
            <h4>{{activeClues.down.number}}. Down</h4>
            <p>{{activeClues.down.prompt || '(No clue set)' }}</p>
          </div>
        </div>
      `,
})
export class PuzzleGridComponent {
  @Input() grid: Grid;
  @Input() editMode: string;
  constructor() {
  }

  onGridKeyUp(event, cell) {
    var isLetter = event.key.match(/[\w]/) && event.key.length === 1;
    if (isLetter) {
      cell.value = event.key.toLowerCase();
      cell.validate();
    }
    var focused = $(':focus');
    var cell = focused.parent();
    var row = cell.parent();
    var colIdx = row.children().index(cell.get(0));
    if (event.key === 'Backspace' || event.key === 'ArrowLeft') cell.prev().find('input').focus();
    else if (isLetter || event.key === 'ArrowRight') cell.next().find('input').focus();
    else if (event.key === 'ArrowUp') row.prev().children().eq(colIdx).find('input').focus();
    else if (event.key === 'ArrowDown') row.next().children().eq(colIdx).find('input').focus();
  }

  puzzleSquareClick(cell: Cell) {
    if (this.editMode === 'grid') {
      cell.toggleFill();
      this.grid.getMirrorCell(cell).toggleFill(cell.filled);
      this.grid.reset();
      return false;
    }
  }

}
