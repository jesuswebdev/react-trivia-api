"use strict";

const Boom = require("@hapi/boom");
const Iron = require("@hapi/iron");
const { iron_password } = require("../../config");

exports.create = async (req, h) => {
  let foundUser = await User.findOne({ email: req.payload.email });
  if (foundUser) {
    return Boom.conflict("Correo electronico en uso");
  }

  let createdUser = null;
  try {
    createdUser = await User(req.payload).save();
  } catch (err) {
    return Boom.internal();
  }

  return h.response(createdUser).code(201);
};

exports.find = async (req, h) => {
  let foundUser = null;
  try {
    foundUser = await User.find({}, { password: false });
  } catch (err) {
    return Boom.internal();
  }

  return { users: foundUser, user_count: foundUser.length };
};

exports.findById = async (req, h) => {
  let foundUser = null;

  if (
    req.auth.credentials.role !== "administrador" &&
    req.auth.credentials.id !== req.params.id
  ) {
    return Boom.forbidden();
  }

  try {
    foundUser = await User.findById(req.params.id, {
      password: false
    }).populate("account_type", "title");
    if (!foundUser) {
      return Boom.notFound("El usuario no existe");
    }
  } catch (err) {
    return Boom.internal();
  }

  return foundUser;
};

exports.update = async (req, h) => {
  let updatedUser = null;

  if (
    req.auth.credentials.id !== req.params.id &&
    req.auth.credentials.role !== "administrador"
  ) {
    return Boom.forbidden();
  }

  try {
    if (req.payload.email) {
      const { _id } = await User.findOne({ email: req.payload.email });
      if (_id.toString() !== req.params.id) {
        return Boom.conflict();
      }
    }

    updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { ...req.payload } },
      { new: true, select: { password: false } }
    );
    if (!updatedUser) {
      return Boom.notFound();
    }
  } catch (err) {
    return Boom.internal();
  }

  return updatedUser;
};

exports.remove = async (req, h) => {
  let deletedUser = null;

  if (req.params.id === req.auth.credentials.id) {
    return Boom.badData();
  }

  try {
    deletedUser = await User.findOneAndRemove({ _id: req.params.id });
    if (!deletedUser) {
      return Boom.notFound();
    }
  } catch (err) {
    return Boom.internal();
  }

  return h.response();
};

exports.login = async (req, h) => {
  let foundUser = null;

  try {
    foundUser = await User.findOne({ email: req.payload.email }).populate(
      "account_type",
      "role permissions"
    );
    if (!foundUser) {
      return Boom.badData(
        "Las credenciales no coinciden con un usuario en nuestro sistema"
      );
    }
    if (foundUser.account_type.role !== "admin") {
      return Boom.notFound("El usuario no existe");
    }
    let same = await foundUser.validatePassword(
      req.payload.password,
      foundUser.password
    );
    if (!same) {
      return Boom.badData(
        "Las credenciales no coinciden con un usuario en nuestro sistema"
      );
    }
  } catch (err) {
    console.log(err);
    return Boom.internal();
  }
  const tokenUser = {
    id: foundUser._id,
    role: foundUser.account_type.role,
    permissions: foundUser.account_type.permissions
  };

  let token = await Iron.seal(tokenUser, iron_password, Iron.defaults);

  foundUser = {
    id: foundUser._id,
    name: foundUser.name,
    email: foundUser.email
  };

  return { token };
};

exports.getAccessToken = async (req, h) => {
  const adminToken = req.path.includes("/admin");
  const [user] = await User.find({
    name: adminToken ? "React Trivia Admin Guest" : "React Trivia Guest"
  }).populate("account_type");

  let token = await Iron.seal(
    {
      id: user._id,
      guest: true,
      permissions: user.account_type.permissions
    },
    iron_password,
    Iron.defaults
  );

  return { token };
};
