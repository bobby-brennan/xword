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
                    [class.highlight]="activeClues && activeClues[activeDirection] && activeClues[activeDirection].cells.indexOf(cell) !== -1"
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
            <div *ngIf="activeClues.across">
              <h4>{{activeClues.across.number}}. Across</h4>
              <p>{{activeClues.across.prompt || '(No clue set)' }}</p>
            </div>
            <div *ngIf="activeClues.down">
              <h4>{{activeClues.down.number}}. Down</h4>
              <p>{{activeClues.down.prompt || '(No clue set)' }}</p>
            </div>
          </div>
        </div>
      `,
})
export class PuzzleGridComponent {
  @Input() grid: Grid;
  @Input() editMode: string;
  activeDirection: string='across';
  constructor() {
  }

  onGridKeyUp(event, cell) {
    var isLetter = event.key.match(/[\w]/) && event.key.length === 1;
    if (isLetter) {
      cell.value = event.key.toLowerCase();
      cell.autocompleted = false;
    } else if (event.key === 'Backspace') {
      cell.value = '';
    }
    var focused = $(':focus');
    var cell = focused.parent();
    var row = cell.parent();
    var colIdx = row.children().index(cell.get(0));
    if (isLetter) this.move('next')
    else if (event.key === 'Backspace') this.move('previous');
    else if (event.key === 'ArrowLeft') this.move('left')
    else if (event.key === 'ArrowRight') this.move('right');
    else if (event.key === 'ArrowUp') this.move('up');
    else if (event.key === 'ArrowDown') this.move('down');
  }

  move (dir) {
    var focused = $(':focus');
    var cell = focused.parent();
    var row = cell.parent();
    var colIdx = row.children().index(cell.get(0));

    if (dir === 'left' || dir === 'right') this.activeDirection = 'across';
    else if (dir === 'down' || dir === 'up') this.activeDirection = 'down';
    else if (dir === 'next') dir = this.activeDirection === 'down' ? 'down' : 'right';
    else if (dir === 'previous') dir = this.activeDirection === 'down' ? 'up' : 'left';

    if (dir === 'left') cell.prev().find('input').focus();
    else if (dir ==='right') cell.next().find('input').focus();
    else if (dir === 'up') row.prev().children().eq(colIdx).find('input').focus();
    else if (dir === 'down') row.next().children().eq(colIdx).find('input').focus();
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
