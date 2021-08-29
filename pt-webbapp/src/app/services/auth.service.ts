import { Observable, of } from 'rxjs';

import { StatusCodes } from './../models/status-codes';
import { Genders } from './../models/genders';
import { Roles } from './../models/roles';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import firebase from 'firebase';
import { switchMap, tap } from 'rxjs/operators';

import { Router } from '@angular/router';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // TODO: undefined should be avoided if possible (null is enough!)
  user$: Observable<User | null | undefined>;
  constructor(
    private _angularFireAuth: AngularFireAuth,
    private _angularFirestore: AngularFirestore,
    private _router: Router
  ) {
    this.user$ = this._angularFireAuth.authState.pipe(
      switchMap((user: firebase.User | null) => {
        if (user) {
          return this._angularFirestore
            .doc<User>(`users/${user.uid}`)
            .valueChanges();
        }
        return of(null);
      })
    );
    // this.user$.toPromise().then((data) => console.log(data));
  }

  /**
   * Let the users sign in using email and password.
   * @param email The user's email adress.
   * @param password The user's password.
   * @returns Promise StatusCodes used to deduce what happend.
   */
  public async signIn(email: string, password: string): Promise<StatusCodes> {
    const result: StatusCodes = await this._angularFireAuth
      .signInWithEmailAndPassword(email, password)
      .then(async (userCredential: firebase.auth.UserCredential) => {
        const user: firebase.User | null = userCredential.user;
        if (user) {
          const userDocRef = this._angularFirestore
            .collection('users')
            .doc(user.uid);
          const statusCode: StatusCodes = await userDocRef
            .get()
            .toPromise()
            .then((doc) => {
              if (doc.exists && doc.get('role') != null) {
                this._router.navigate([doc.get('role')]);
                return StatusCodes.Success;
              }
              return StatusCodes.NotFound;
            })
            .catch((_) => {
              return StatusCodes.Error;
            });

          return statusCode;

          // this._router.navigate([]);
          // const idToken: string | null = await userCredential.user
          //   .getIdToken()
          //   .then((token: string) => {
          //     return token;
          //   })
          //   .catch(() => {
          //     return null;
          //   });
          // idToken && sessionStorage.setItem('idToken', idToken);
          // console.log(sessionStorage.getItem('idToken'));
        }
        return StatusCodes.Error;
      })
      .catch((error: any) => {
        if (error.code == 'auth/user-not-found') {
          return StatusCodes.NotFound;
        } else if (error.code == 'auth/invalid-email') {
          return StatusCodes.InvalidEmail;
        } else if (error.code == 'auth/wrong-password') {
          return StatusCodes.CantAccess;
        }
        return StatusCodes.Error;
      });
    // this.user$.toPromise().then((data) => console.log(data));

    return result;
  }

  /**
   * Let the user sign up using email and password as well as some basic information about themselves.
   * @param firstName The user's first name.
   * @param lastName The user's last name.
   * @param birthdate The user's birthdate in string format.
   * @param gender The user's gender.
   * @param email The user's email adress.
   * @param password The user's password.
   * @returns Promise StatusCodes used to deduce what happend.
   */
  public async signUp(
    firstName: string,
    lastName: string,
    birthdate: string,
    gender: Genders,
    email: string,
    password: string
  ): Promise<StatusCodes> {
    const result: StatusCodes = await this._angularFireAuth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential: firebase.auth.UserCredential) => {
        let user: firebase.User | null = userCredential.user;
        if (user) {
          user.updateProfile({
            displayName: firstName + ' ' + lastName,
          });
          const userRef: AngularFirestoreDocument<unknown> =
            this._angularFirestore.collection('users').doc(user.uid);
          //! role must always be Roles.User
          userRef.set({
            role: Roles.User,
            firstName: firstName,
            lastName: lastName,
            birthdate: birthdate,
            gender: gender,
          });
          return StatusCodes.Success;
        }
        return StatusCodes.Error;
      })
      .catch((error: any) => {
        if (error.code == 'auth/email-already-in-use') {
          return StatusCodes.EmailAlreadyInUse;
        } else if (error.code == 'auth/invalid-email') {
          return StatusCodes.InvalidEmail;
        }
        return StatusCodes.Error;
      });
    return result;
  }

  /**
   * Signs the user out and redirects the user to the home page.
   */
  public signOut() {
    this._angularFireAuth.signOut().then(() => this._router.navigate(['/']));
  }
}
