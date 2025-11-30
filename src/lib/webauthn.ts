// WebAuthn client-side utilities

// WebAuthn type definitions
interface CredentialDescriptor {
  id: string;
  type: string;
}

interface PublicKeyCredentialWithTransports extends PublicKeyCredential {
  response: AuthenticatorAttestationResponse & {
    getTransports?: () => string[];
  };
}

// Helper function to convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper function to convert ArrayBuffer to base64url
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function registerWebAuthn() {
  try {
    // Get registration options from server
    const response = await fetch('/api/webauthn/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    console.log('Received options:', JSON.stringify(data.options, null, 2));

    // Convert challenge and user ID from base64url to ArrayBuffer
    const options = {
      ...data.options,
      challenge: base64urlToArrayBuffer(data.options.challenge),
      user: {
        ...data.options.user,
        id: base64urlToArrayBuffer(data.options.user.id),
      },
      excludeCredentials: data.options.excludeCredentials?.map((cred: CredentialDescriptor) => ({
        ...cred,
        id: base64urlToArrayBuffer(cred.id),
      })),
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: options,
    }) as PublicKeyCredentialWithTransports;

    if (!credential) {
      throw new Error('Keine Anmeldedaten erstellt');
    }

    // Verify registration with server
    const verifyResponse = await fetch('/api/webauthn/register/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential: {
          id: credential.id,
          rawId: arrayBufferToBase64url(credential.rawId),
          response: {
            attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
            clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
            transports: credential.response.getTransports ? credential.response.getTransports() : [],
          },
          type: credential.type,
        },
        challenge: data.options.challenge, // Send the original challenge
      }),
    });

    console.log('Sending challenge to register verify:', data.options.challenge);

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      throw new Error(verifyData.message);
    }

    return verifyData;
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    throw error;
  }
}

export async function authenticateWebAuthn(email: string) {
  try {
    // Get authentication options from server
    const response = await fetch('/api/webauthn/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // Convert challenge and allowCredentials from base64url to ArrayBuffer
    const options = {
      ...data.options,
      challenge: base64urlToArrayBuffer(data.options.challenge),
      allowCredentials: data.options.allowCredentials?.map((cred: CredentialDescriptor) => ({
        ...cred,
        id: base64urlToArrayBuffer(cred.id),
      })),
    };

    // Get credential
    const credential = await navigator.credentials.get({
      publicKey: options,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Keine Anmeldedaten gefunden');
    }

    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    // Verify authentication with server
    const verifyResponse = await fetch('/api/webauthn/authenticate/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential: {
          id: credential.id,
          rawId: arrayBufferToBase64url(credential.rawId),
          response: {
            authenticatorData: arrayBufferToBase64url(assertionResponse.authenticatorData),
            clientDataJSON: arrayBufferToBase64url(assertionResponse.clientDataJSON),
            signature: arrayBufferToBase64url(assertionResponse.signature),
            userHandle: assertionResponse.userHandle ? arrayBufferToBase64url(assertionResponse.userHandle) : null,
          },
          type: credential.type,
        },
        userId: data.userId,
        challenge: data.options.challenge, // Send the original challenge
      }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      throw new Error(verifyData.message);
    }

    return verifyData;
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    throw error;
  }
}

export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for basic WebAuthn support
  if (!window.navigator || !window.navigator.credentials) return false;
  if (!window.PublicKeyCredential) return false;

  // Check for required methods
  if (typeof window.navigator.credentials.create !== 'function') return false;
  if (typeof window.navigator.credentials.get !== 'function') return false;

  // Additional check for secure context (HTTPS or localhost)
  if (!window.isSecureContext && window.location.hostname !== 'localhost') return false;

  return true;
}
