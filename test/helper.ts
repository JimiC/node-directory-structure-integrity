export function checker(
  hash: string, encodingPattern: RegExp, hashToMatch: string,
  algorithmToMatch = 'sha1', lengthToMatch = 0,
): boolean {
  const members: string[] = hash.split('-');
  const matchAlgorithm = members[0] === algorithmToMatch;
  const matchEncoding = encodingPattern.test(members[1]) && members[1] === hashToMatch;
  const matchLength = lengthToMatch > 1 ? members[1].length === lengthToMatch : true;
  return matchAlgorithm && matchEncoding && matchLength;
}
