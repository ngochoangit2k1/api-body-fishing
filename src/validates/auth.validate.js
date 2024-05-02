const validateEmail = (email) => {
    const re =
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(email);
};

const validatePassword = (password, error) => {
    if (password.length < 8) {
        return error.message('Mật khẩu cần dài ít nhất 6 ký tự');
    }
    if (!password.match(/\d/) || !value.match(/[a-zA-Z]/)) {
        return error.message('Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số');
    }
    return password;
}
module.exports = {
    validateEmail,
    validatePassword
}