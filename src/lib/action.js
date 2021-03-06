const texasHoldem = require("./texas-holdem");
const { getState, updateState } = require("./db-utils");
const { WARM_UP } = require("./types");

module.exports = async (
  db,
  { tableId, playerId, type, amount = 0, autofoldCount }
) => {
  await db.runTransaction(async tx => {
    let [players, table] = await getState(db, tx, tableId);

    if (type !== WARM_UP)
      texasHoldem(table, players, {
        type,
        playerId,
        amount,
        autofoldCount
      });

    await updateState(db, tx, tableId, table, players);
  });
};
