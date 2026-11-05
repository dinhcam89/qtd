/**
 * Tạo đường dẫn SVG (<path d="...">) chuẩn mã QR ISO/IEC 18004 (Version 3-M, 29x29 modules)
 * chạy lúc build tĩnh (không dùng thư viện bên thứ ba), chừa ô trung tâm 7x7 cho logo Quỹ.
 */
export function generateQrSvgPath(text: string): string {
  const bytes = Array.from(Buffer.from(text, 'utf8')).slice(0, 42);
  const dataCodewordsCount = 44;
  const ecCodewordsCount = 26;

  const bits: number[] = [];
  const pushBits = (val: number, len: number): void => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Byte mode indicator (0100) + character count (8 bits)
  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (tối đa 4 bit 0)
  const maxDataBits = dataCodewordsCount * 8;
  const terminatorLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, terminatorLen);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bits[i + j];
    }
    data.push(byteVal);
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (data.length < dataCodewordsCount) {
    data.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // Trường hữu hạn GF(256) với đa thức nguyên thủy 0x11d
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let val = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = val;
    log[val] = i;
    val <<= 1;
    if ((val & 0x100) !== 0) {
      val ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    exp[i] = exp[i - 255];
  }

  const gfMul = (a: number, b: number): number => {
    if (a === 0 || b === 0) return 0;
    return exp[log[a] + log[b]];
  };

  // Đa thức sinh Reed-Solomon bậc 26
  let gen = [1];
  for (let i = 0; i < ecCodewordsCount; i++) {
    const next = new Array<number>(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], exp[i]);
    }
    gen = next;
  }

  const msg = [...data, ...new Array<number>(ecCodewordsCount).fill(0)];
  for (let i = 0; i < dataCodewordsCount; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  const codewords = [...data, ...msg.slice(dataCodewordsCount)];

  const n = 29;
  const grid: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0)
  );
  const reserved: boolean[][] = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false)
  );

  const placeFinder = (row: number, col: number): void => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
          const inOuter =
            dr >= 0 &&
            dr <= 6 &&
            dc >= 0 &&
            dc <= 6 &&
            (dr === 0 || dr === 6 || dc === 0 || dc === 6);
          const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          grid[nr][nc] = inOuter || inInner ? 1 : 0;
          reserved[nr][nc] = true;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, n - 7);
  placeFinder(n - 7, 0);

  // Alignment pattern cho Version 3 tại (22, 22)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const nr = 22 + dr;
      const nc = 22 + dc;
      grid[nr][nc] =
        Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)
          ? 1
          : 0;
      reserved[nr][nc] = true;
    }
  }

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    const bit = i % 2 === 0 ? 1 : 0;
    grid[6][i] = bit;
    reserved[6][i] = true;
    grid[i][6] = bit;
    reserved[i][6] = true;
  }

  // Dark module
  grid[4 * 3 + 9][8] = 1;
  reserved[4 * 3 + 9][8] = true;

  // Vùng dự trữ Format Info
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][n - 1 - i] = true;
    reserved[n - 1 - i][8] = true;
  }

  const allBits: number[] = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((cw >> i) & 1);
    }
  }
  for (let i = 0; i < 7; i++) {
    allBits.push(0);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) {
      const r = upward ? n - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!reserved[r][c]) {
          let bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          if ((r + c) % 2 === 0) {
            bit ^= 1;
          }
          grid[r][c] = bit;
        }
      }
    }
    upward = !upward;
  }

  // Format info cho Level M (00) + Mask 0 (000) => 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const fPos1: Array<[number, number]> = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  const fPos2: Array<[number, number]> = [
    [n - 1, 8],
    [n - 2, 8],
    [n - 3, 8],
    [n - 4, 8],
    [n - 5, 8],
    [n - 6, 8],
    [n - 7, 8],
    [8, n - 8],
    [8, n - 7],
    [8, n - 6],
    [8, n - 5],
    [8, n - 4],
    [8, n - 3],
    [8, n - 2],
    [8, n - 1],
  ];

  for (let i = 0; i < 15; i++) {
    grid[fPos1[i][0]][fPos1[i][1]] = formatBits[i];
    grid[fPos2[i][0]][fPos2[i][1]] = formatBits[i];
  }

  let pathData = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // Chừa vùng trung tâm 7x7 (từ module 11 đến 17) để đặt logo & tên Quỹ ở giữa
      if (r >= 11 && r <= 17 && c >= 11 && c <= 17) {
        continue;
      }
      if (grid[r][c] === 1) {
        pathData += `M${c + 1},${r + 1}h1v1h-1z`;
      }
    }
  }

  return pathData;
}
