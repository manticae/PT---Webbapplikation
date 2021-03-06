import { CardNavigation } from '../../shared/models/cardNavigation';
import { AuthService } from '../../core/services/auth.service';
import { Component, OnInit } from '@angular/core';
import firebase from 'firebase';

@Component({
  selector: 'app-member-page',
  templateUrl: './member-page.component.html',
  styleUrls: ['./member-page.component.scss'],
})
export class MemberPageComponent implements OnInit {
  constructor(private _authService: AuthService) {}

  ngOnInit(): void {}
}
