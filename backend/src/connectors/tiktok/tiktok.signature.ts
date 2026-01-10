import * as crypto from 'crypto';

const EXCLUDE_KEYS = ['access_token', 'sign'];

export function validateTiktokSignature(req: any, appSecret: string): boolean {
  const query = req.query || {};

  // Step 1: Sort query params alphabetically (excluding sign & access_token)
  const sortedParams = Object.keys(query)
    .filter((key) => !EXCLUDE_KEYS.includes(key))
    .sort()
    .map((key) => `${key}${query[key]}`)
    .join('');

  // Step 2: Prepend API path
  let signString = `${req.path}${sortedParams}`;

  // Step 3: Append raw body if not multipart
  const contentType = req.headers['content-type'] || '';
  if (
    contentType !== 'multipart/form-data' &&
    req.rawBody &&
    req.rawBody.length > 0
  ) {
    signString += req.rawBody;
  }

  // Step 4: Wrap with app_secret
  signString = `${appSecret}${signString}${appSecret}`;

  // Step 5: HMAC-SHA256
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(signString);
  const expectedSign = hmac.digest('hex');

  return expectedSign === query.sign;
}
