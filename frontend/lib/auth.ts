import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

const DEV_USER_SUB = 'local-user-sub';

export function isDevAuthMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true') return true;
  if (process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'false') return false;
  return !process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
}

function setAuthCookie(token: string) {
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

function getPool(): CognitoUserPool {
  const UserPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const ClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!UserPoolId || !ClientId) {
    throw new Error('Cognito is not configured.');
  }
  return new CognitoUserPool({ UserPoolId, ClientId });
}

export function signIn(email: string, password: string): Promise<CognitoTokens> {
  if (isDevAuthMode()) {
    setAuthCookie(DEV_USER_SUB);
    return Promise.resolve({
      idToken: DEV_USER_SUB,
      accessToken: DEV_USER_SUB,
      refreshToken: DEV_USER_SUB,
    });
  }

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    const details = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(details, {
      onSuccess(session) {
        const idToken = session.getIdToken().getJwtToken();
        setAuthCookie(idToken);
        resolve({
          idToken,
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        });
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<string> {
  if (isDevAuthMode()) {
    void password;
    void fullName;
    return Promise.resolve(`dev-${email}`);
  }

  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: 'name', Value: fullName }),
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    getPool().signUp(email, password, attributes, [], (err, result) => {
      if (err) return reject(err);
      resolve(result!.userSub);
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  if (isDevAuthMode()) {
    void email;
    void code;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function signOut(): void {
  if (!isDevAuthMode()) {
    try {
      getPool().getCurrentUser()?.signOut();
    } catch {
      // Cognito not configured
    }
  }
  document.cookie = 'auth_token=; Max-Age=0; path=/';
}
