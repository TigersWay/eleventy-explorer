const compareValues = (path, ascendingOrder = true) => {
  return function innerSort(a, b) {
    const varA = _get(a, path), varB = _get(b, path);

    let comparison = 0;
    if (!varA && !varB) {
      comparison = 0;
    } else if (!varB || varA > varB) {
      comparison = 1;
    } else if (!varA || varA < varB) {
      comparison = -1;
    }

    return (ascendingOrder ? comparison : comparison * -1);
  };
};

const _get = (object, path, defaultValue) => String(path).split('.').reduce((o, p) => Reflect.has(o, p) ? o[p] : defaultValue, object);

module.exports = {

  orderBy: (collection, path, ascendingOrder = true) => collection.sort(compareValues(path, ascendingOrder)),

  filter: (collection, path, value) => collection.filter(item => _get(item, path) === value),

  head: (collection, count) => collection.slice(0, count),
  tail: (collection, count) => collection.slice(-count),

  slice: (collection, start, end) => collection.slice(start, end),

  paginate: (collection, current, itemsPerPage, delta = 2) => {
    if (!collection || !current || !itemsPerPage) return null;

    const
      lastPage = Math.ceil(collection.length / itemsPerPage),
      prev = current === 1 ? null : current - 1,
      next = current === lastPage ? null : current + 1,
      items = [1];

    if (current === 1 && lastPage === 1) return { current, prev, next, items };

    if (current > 4) items.push('…');

    const
      r = delta,
      r1 = current - r,
      r2 = current + r;
    for (let i = r1 > 2 ? r1 : 2; i <= Math.min(lastPage, r2); i++) items.push(i);

    if (r2 + 1 < lastPage) items.push('…');
    if (r2 < lastPage) items.push(lastPage);

    return { current, prev, next, items };
  },

  multipleSearch: (collection, path, terms = '') => collection.filter(item => terms.split('+').every(t => _get(item, path).match(t)))

};

