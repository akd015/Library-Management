import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { LoadingBar } from './layout/loading-bar/loading-bar';

@Component({
  selector: 'app-root',
  imports: [Navbar, LoadingBar, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('library-management-system');
}
