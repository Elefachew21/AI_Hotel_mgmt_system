import Counter from "../models/Counter.js";

export const getNextSequence = async (
  sequenceKey,
  session = null
) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceKey },
    {
      $inc: {
        sequence: 1
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session
    }
  );

  return counter.sequence;
};
export const generateOrderNumber = async (session = null) => {
  const sequence = await getNextSequence(
    "FOOD_ORDER",
    session
  );

  return `ORD_${sequence}`;
};