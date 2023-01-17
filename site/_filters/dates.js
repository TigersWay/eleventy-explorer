const
  dayjs = require('dayjs');

dayjs
  .extend(require('dayjs/plugin/localizedFormat'))
  .extend(require('dayjs/plugin/utc'))
  .extend(require('dayjs/plugin/relativeTime'));

module.exports = {

  dateFormat: (date, format = 'LLL') => dayjs(date).format(format),

  dateRelative: (date) => dayjs(date).utc().fromNow(),

  dateISO: (date) => dayjs(date).toISOString()
};
