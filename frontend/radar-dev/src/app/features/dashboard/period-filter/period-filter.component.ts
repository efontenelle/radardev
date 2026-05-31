import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-period-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './period-filter.component.html',
  styleUrl: './period-filter.component.scss'
})
export class PeriodFilterComponent implements OnInit {
  @Output() rangeChange = new EventEmitter<DateRange>();

  fromDate = '';
  toDate = '';
  validationError = '';

  ngOnInit(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);

    this.toDate = this.toInputValue(to);
    this.fromDate = this.toInputValue(from);

    this.emit();
  }

  onApply(): void {
    this.validate();
    if (this.validationError) return;
    this.emit();
  }

  private validate(): void {
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
    if (!this.fromDate || !this.toDate) {
      this.validationError = 'Selecione as datas de início e fim.';
    } else if (from > to) {
      this.validationError = 'A data de início não pode ser posterior à data de fim.';
    } else {
      this.validationError = '';
    }
  }

  private emit(): void {
    this.rangeChange.emit({
      from: new Date(this.fromDate),
      to: new Date(this.toDate)
    });
  }

  private toInputValue(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}
