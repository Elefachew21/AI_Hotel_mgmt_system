import {
  createKitchenOrderTicket,
  getKitchenOrderTickets,
  getKitchenOrderTicketById,
  startCooking,
  markKotReady,
  cancelKot
} from "../services/kitchenOrderTicket.service.js";

export const createKot = async (req, res, next) => {
  try {
    const kot = await createKitchenOrderTicket({
      foodOrderId: req.body.foodOrderId
    });

    return res.status(201).json({
      success: true,
      message: "Kitchen order ticket created successfully",
      data: { kot }
    });
  } catch (error) {
    next(error);
  }
};

export const getKots = async (req, res, next) => {
  try {
    const kots = await getKitchenOrderTickets({
      status: req.query.status
    });

    return res.status(200).json({
      success: true,
      data: { kots }
    });
  } catch (error) {
    next(error);
  }
};

export const getKot = async (req, res, next) => {
  try {
    const kot = await getKitchenOrderTicketById(req.params.id);

    return res.status(200).json({
      success: true,
      data: { kot }
    });
  } catch (error) {
    next(error);
  }
};

export const startKotCooking = async (req, res, next) => {
  try {
    const kot = await startCooking(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Kitchen order has started cooking",
      data: { kot }
    });
  } catch (error) {
    next(error);
  }
};

export const completeKot = async (req, res, next) => {
  try {
    const kot = await markKotReady(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Kitchen order marked as ready",
      data: { kot }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelKitchenOrder = async (req, res, next) => {
  try {
    const kot = await cancelKot(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Kitchen order cancelled successfully",
      data: { kot }
    });
  } catch (error) {
    next(error);
  }
};