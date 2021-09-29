import { StatusCodes } from './../models/status-codes';
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import firebase from 'firebase';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private _angularFirestore: AngularFirestore) {}

  /**
   *! Will only work if the user recently signed in. In order to work correctly
   *! the user needs to be re-authenticated.
   *
   * Updates user password to newPassword.
   * @returns Promise StatusCodes used to deduce what happend
   */
  public async updatePassword(newPassword: string): Promise<StatusCodes> {
    const user: firebase.User | null = firebase.auth().currentUser;
    if (user) {
      const statusCode: StatusCodes = await user
        .updatePassword(newPassword)
        .then((_) => {
          return StatusCodes.Success;
        })
        .catch((error) => {
          console.log(error);

          return StatusCodes.Error;
        });
      return statusCode;
    }
    return StatusCodes.Error;
  }

  /**
   *! Will only work if the user recently signed in. In order to work correctly
   *! the user needs to be re-authenticated.
   *
   * Updates user email to newEmail.
   * @returns Promise StatusCodes used to deduce what happend
   */
  public async updateEmail(newEmail: string): Promise<StatusCodes> {
    const user: firebase.User | null = firebase.auth().currentUser;

    if (user) {
      const result: StatusCodes = await user
        .updateEmail(newEmail)
        .then(() => {
          const userRef: AngularFirestoreDocument<unknown> =
            this._angularFirestore.collection('users').doc(user.uid);
          userRef.set(
            {
              email: newEmail,
            },
            { merge: true }
          );
          return StatusCodes.Success;
        })
        .catch((error) => {
          switch (error.code) {
            case 'auth/email-already-in-use':
              return StatusCodes.EmailAlreadyInUse;
            case 'auth/invalid-email':
              return StatusCodes.InvalidEmail;
            default:
              return StatusCodes.Error;
          }
        });
      return result;
    }
    return StatusCodes.Error;
  }

  /**
   *! Will only work if the user recently signed in. In order to work correctly
   *! the user needs to be re-authenticated.
   *
   * Deletes a user and info about the user.
   * @param uid the users unique id.
   * @returns Promise StatusCodes used to deduce what happend.
   */
  public async deleteUser(): Promise<StatusCodes> {
    const user: firebase.User | null = firebase.auth().currentUser;
    if (user) {
      const statusCode: StatusCodes = await this._angularFirestore
        .collection('users')
        .doc(user.uid)
        .delete()
        .then(async () => {
          const statusCode: StatusCodes = await user
            .delete()
            .then(() => {
              return StatusCodes.Success;
            })
            .catch(() => {
              return StatusCodes.Error;
            });
          return statusCode;
        })
        .catch(() => {
          return StatusCodes.Error;
        });
      return statusCode;
    }
    return StatusCodes.Error;
  }
}
