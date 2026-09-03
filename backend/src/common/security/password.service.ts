import { Injectable } from '@nestjs/common';
import { hash, verify, argon2id } from 'argon2';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
  }
  verify(hashValue: string, password: string): Promise<boolean> {
    return verify(hashValue, password);
  }
}
