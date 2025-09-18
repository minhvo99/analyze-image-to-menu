// utils/menuParser.js
export function normalizeOcrText(rawText) {
  let lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);

  const merged = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Nếu chỉ có $ hoặc chỉ số nhỏ (<10) thì nối vào dòng trước
    if (line === '$' || /^[0-9]$/.test(line)) {
      if (merged.length > 0) {
        merged[merged.length - 1] += ' ' + line;
      }
      continue;
    }

    // Nếu bắt đầu bằng "&" hoặc "." hoặc chữ thường → continuation
    if (/^(&|\.)/.test(line) || /^[a-z]/.test(line)) {
      if (merged.length > 0) {
        merged[merged.length - 1] += ' ' + line;
      } else {
        merged.push(line);
      }
      continue;
    }

    merged.push(line);
  }

  return merged;
}

export function parseMenuText(rawText) {
  const lines = normalizeOcrText(rawText);

  let restaurant = null;
  let description = null;
  const meals = [];
  let currentMeal = null;

  const priceRegex = /\$?\s?(\d{1,3}(?:[.,]\d{3})*|\d+)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect restaurant
    if (/restaurant/i.test(line)) {
      restaurant = restaurant ? restaurant + ' ' + line : line;
      continue;
    }

    // Detect description
    if (line.split(' ').length > 8 && !/\d/.test(line)) {
      description = description ? description + ' ' + line : line;
      continue;
    }

    const prices = [...line.matchAll(priceRegex)].map((m) => m[1]);

    if (prices.length > 0) {
      // Nếu line chỉ chứa số → attach vào món trước
      if (/^\$?\d+$/.test(line) && currentMeal) {
        if (!Array.isArray(currentMeal.price)) {
          currentMeal.price = [{ value: currentMeal.price, note: 'Regular' }];
        }
        currentMeal.price.push({
          value: prices[0],
          note: `Option ${currentMeal.price.length + 1}`,
        });
        continue;
      }

      // Kết thúc món cũ
      if (currentMeal) meals.push(currentMeal);

      if (prices.length > 1) {
        currentMeal = {
          name: line.replace(priceRegex, '').replace('$', '').trim(),
          another_name: null,
          price: prices.map((p, idx) => ({
            value: p.replace(/[^\d]/g, ''),
            note: idx === 0 ? 'Regular' : `Option ${idx + 1}`,
          })),
          note: null,
        };
      } else {
        currentMeal = {
          name: line.replace(priceRegex, '').replace('$', '').trim(),
          another_name: null,
          price: prices[0].replace(/[^\d]/g, ''),
          note: null,
        };
      }
    } else {
      if (currentMeal) {
        // Song ngữ (Hàn, Trung, Nhật)
        if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(line)) {
          currentMeal.another_name = currentMeal.another_name
            ? currentMeal.another_name + '/' + line
            : line;
        }
        // Note
        else if (/rice|spicy|included/i.test(line)) {
          currentMeal.note = line;
        }
        // Continuation → nối vào tên
        else if (/^[a-z]/.test(line)) {
          currentMeal.name += ' ' + line;
        } else {
          meals.push(currentMeal);
          currentMeal = {
            name: line,
            another_name: null,
            price: null,
            note: null,
          };
        }
      } else {
        currentMeal = {
          name: line,
          another_name: null,
          price: null,
          note: null,
        };
      }
    }
  }

  if (currentMeal) meals.push(currentMeal);

  return { restaurant, description, meals };
}
