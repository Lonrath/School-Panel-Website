import PropTypes from "prop-types";
import React, { useState } from "react";

import { Row, Col, CardBody, Card, Alert,  Container, Form, Input, FormFeedback,  Label,} from "reactstrap";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { Link, useNavigate } from "react-router-dom";
import withRouter from "components/Common/withRouter";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";

// actions
import { loginUser, socialLogin } from "../../store/actions";

// import images
import profile from "assets/images/profile-img.png";
import logo from "assets/images/logo.svg";

const Login = (props) => {
  //meta title
  document.title = "Login | Skote - React Admin & Dashboard Template";

  const dispatch = useDispatch();

  const navigate = useNavigate(); 
  const [errorMessage, setErrorMessage] = useState(""); // useState ile hata mesajı kontrolü

  const [getIsActive, setIsActive] = useState(false);

  const [getMail, setMail] = useState(false);
  const [getPassword, setPassword] = useState(false);

  // Formik validation: TC Kimlik numarası ve şifre doğrulaması
  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: getMail != null ? getMail : "",
      password: getPassword != null ? getPassword : "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Lütfen TC Kimlik numaranızı girin"),
      password: Yup.string().required("Lütfen Şifrenizi Giriniz"),
    }),
    onSubmit: (values) => {
      if (getIsActive === true) {

        localStorage.setItem("rememberMail", values.email);
        localStorage.setItem("rememberPassword", values.password);
        localStorage.setItem("rememberCheck", getIsActive);

      }

      dispatch(loginUser(values, props.router.navigate));
    },
  });

  const LoginProperties = createSelector(
    (state) => state.Login,
    (login) => ({
      error: login.error,
    })
  );

  const { error } = useSelector(LoginProperties);

  const signIn = (type) => {
    dispatch(socialLogin(type, props.router.navigate));
  };

  const socialResponse = (type) => {
    signIn(type);
  };

  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <div className="bg-primary-subtle">
                  <Row>
                    <Col className="col-7">
                      <div className="text-primary p-4">
                        <h5 className="text-primary">Hoş Geldiniz!</h5>
                        <p>Giriş yapmak için bilgilerinizi girin.</p>
                      </div>
                    </Col>
                    <Col className="col-5 align-self-end">
                      <img src={profile} alt="" className="img-fluid" />
                    </Col>
                  </Row>
                </div>
                <CardBody className="pt-0">
                  <div>
                    <Link to="/" className="logo-light-element">
                      <div className="avatar-md profile-user-wid mb-4">
                        <span className="avatar-title rounded-circle bg-light">
                          <img
                            src={logo}
                            alt=""
                            className="rounded-circle"
                            height="34"
                          />
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="p-2">
                    <Form
                      className="form-horizontal"
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      
                      {error && <Alert color="danger">{errorMessage|| "TCKN veya Şifre Hatalı"}</Alert>}

                      <div className="mb-3">
                        <Label className="form-label">
                          TC Kimlik Numarası
                        </Label>
                        <Input
                          name="email"
                          className="form-control"
                          placeholder="TC Kimlik Numaranızı Giriniz"
                          type="text"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={validation.touched.email &&validation.errors.email? true: false }
                        />
                        {validation.touched.email &&validation.errors.email ? (
                          <FormFeedback type="invalid">
                            {validation.errors.email}
                          </FormFeedback>) : null}
                        {validation.touched.tckn &&validation.errors.tckn ? (
                          <FormFeedback type="invalid">
                            {validation.errors.tckn}
                          </FormFeedback>
                        ) : null}
                      </div>

                      <div className="mb-3">
                        <Label className="form-label">Şifre</Label>
                        <Input
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Şifrenizi girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={validation.touched.password &&validation.errors.password ? true : false}
                        />
                        {validation.touched.password &&
                        validation.errors.password ? (
                          <FormFeedback type="invalid">
                            {validation.errors.password}
                          </FormFeedback>
                        ) : null}
                      </div>

                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="customControlInline"
                          checked={getIsActive}
                          onChange={() => setIsActive(!getIsActive)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="customControlInline"
                        >
                          Beni Hatırla
                        </label>
                      </div>

                      <div className="mt-3 d-grid">
                        <button
                          className="btn btn-primary btn-block"
                          type="submit"
                        >
                          Giriş Yap
                        </button>
                      </div>

                      <div className="mt-4 text-center">
                        <h5 className="font-size-14 mb-3">
                          Sosyal Medya ile Giriş
                        </h5>

                        <ul className="list-inline">
                          <li className="list-inline-item">
                            <Link
                              to="#"
                              className="social-list-item bg-primary text-white border-primary"
                              onClick={(e) => {
                                e.preventDefault();
                                socialResponse("facebook");
                              }}
                            >
                              <i className="mdi mdi-facebook" />
                            </Link>
                          </li>
                          <li className="list-inline-item">
                            <Link
                              to="#"
                              className="social-list-item bg-danger text-white border-danger"
                              onClick={(e) => {
                                e.preventDefault();
                                socialResponse("google");
                              }}
                            >
                              <i className="mdi mdi-google" />
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-4 text-center">
                        <Link to="/forgot-password" className="text-muted">
                          <i className="mdi mdi-lock me-1" />
                          Şifrenizi mi unuttunuz?
                        </Link>
                      </div>
                    </Form>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                <p>
                  Henüz bir hesabınız yok mu?{" "}
                  <Link to="/register" className="fw-medium text-primary">
                    {" "}
                    Şimdi Kayıt Ol{" "}
                  </Link>
                </p>
                <p>
                  © {new Date().getFullYear()} Skote. Crafted with{" "}
                  <i className="mdi mdi-heart text-danger" /> by Themesbrand
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
};
