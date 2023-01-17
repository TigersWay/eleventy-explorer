module.exports = {

  shortNumber: (value) => Intl.NumberFormat('en', { notation: 'compact' }).format(value)

};
