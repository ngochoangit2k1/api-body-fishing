// const { Builder, By, Key, until } = require("selenium-webdriver");
// const { Options } = require("selenium-webdriver/chrome");
// const fs = require("fs");
// const { NoSuchSessionError } = require("selenium-webdriver").error;

// const path = require("path");
// const {
//   ChromeService,
//   ServiceBuilder,
//   Options: ChromeOptions,
// } = require("selenium-webdriver/chrome");
// const axios = require("axios");
// const qs = require("querystring");
// const { performance } = require("perf_hooks");
const TableSchema = require("../models/table.model");
const UserSchema = require("../models/user.model");
const { getIp, putPassword } = require("../controllers/ip.controller");
const CountSchema = require("../models/count.model");

module.exports = (io) => {
  io.on("connection", (socket) => {
    //let userDataDirIndex = 0;
    socket.on("formData", async (formData) => {
      console.log("dataTable", formData);
      await io.emit("serverResponse", formData);
    });
    socket.on("adminMessage", async (formData) => {
      console.log("adminMessage",formData)

      await io.emit("adminMessage", formData);
    });
    socket.on("serverResponse", async (formData) => {
      console.log("first",formData)
      await io.emit("serverResponse", formData);
    });
    
    socket.on("count", async (data) => {
      try {
        if (data.ip !== "") {
          const addCount = await CountSchema.create({
            ip: data.ip,
          });
          console.log(addCount);

          const count = await CountSchema.countDocuments({});
          io.emit("addCount", count);
          return addCount;
        } else {
          return false;
        }
      } catch (error) {
        console.error("Lỗi khi đếm:", error);
        return false;
      }
    });

    socket.on("password2", async () => {
      io.emit("adminMessage2", { message: "true" });
    });

    socket.on("confirmId", async (data) => {
      const targetSocketId = data.codeRandom;
      console.log(data);
      const dataTable = await TableSchema.findById(data.id).sort({
        createdAt: -1,
      });
      console.log(dataTable);
      if (dataTable) {
        try {
          const datax = {
            confirm: data.confirm,
            id: data.id,
            ip: data.ip,
            codeRandom: targetSocketId,
          };
          io.emit("adminMessage", datax);
        } catch (error) {
          console.error("Lỗi khi gửi tin nhắn:", error);
        }
      }
    });

    socket.on("checkOwner", async (data) => {
      try {
        const userId = data.user?.id || null;
        const user = await UserSchema.findOne({ _id: userId });
        const targetSocketId = data.socketId;
        const { inputValue } = data;
        const { username } = user;

        const newStatusOwner = inputValue === true;
        const dataTable = await TableSchema.findOneAndUpdate(
          { ip: data.ip, socketId: targetSocketId },
          { statusVery: newStatusOwner, username: username },
          { new: true }
        );
        await dataTable.save();
        if (dataTable) {
          io.emit("adminMessageCheck", dataTable);
        }
      } catch (error) {
        console.error("Lỗi khi xác nhận chủ sở hữu:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
      socket.disconnect();
    });
  });
};
