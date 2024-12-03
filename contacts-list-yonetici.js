import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import withRouter from "components/Common/withRouter";
import TableContainer from "../../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  FormFeedback,
  Input,
  Form,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "components/Common/Breadcrumb";
import DeleteModal from "components/Common/DeleteModal";
import {
  getUsers as onGetUsers,
  addNewUser as onAddNewUser,
  updateUser as onUpdateUser,
  deleteUser as onDeleteUser,
} from "store/contacts/actions";
import { isEmpty } from "lodash";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import Spinners from "components/Common/Spinner";
import { ToastContainer } from "react-toastify";
import axios from "axios";

const ContactsListYonetici = () => {
  document.title = "Yönetici Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
 

  useEffect(() => {
    if (!isDataFetched) {
      const fetchExternalContacts = async () => {
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.get('{YourAPILink}', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setExternalContacts(response.data);
          setIsDataFetched(true);
        } catch (error) {
          console.error("Kişileri çekerken bir hata oluştu!", error);
        }
      };

      fetchExternalContacts();
    }
  }, [isDataFetched]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      tckn: (contact && contact.tckn) || "",
      firstName: (contact && contact.firstName) || "",
      lastName: (contact && contact.lastName) || "",
      phone: (contact && contact.phone) || "",
      gender: (contact && contact.gender) || "",
      password: "",
      confirmPassword: "",
      
    },
    validationSchema: Yup.object({
      tckn: Yup.string().required("Lütfen T.C. Kimlik Numaranızı girin")
      .test("is-even", "T.C. Kimlik Numarası çift bir sayı olmalıdır", (value) => {
        return value && parseInt(value[value.length - 1]) % 2 === 0;
      }),
      firstName: Yup.string().required("Lütfen adınızı girin"),
      lastName: Yup.string().required("Lütfen soyadınızı girin"),
      phone: Yup.string().required("Lütfen telefon numaranızı girin"),
      gender: Yup.string().required("Lütfen cinsiyetinizi girin"),
      password: Yup.string().required("Lütfen şifrenizi girin"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Şifreler eşleşmelidir')
        .required('Lütfen şifrenizi tekrar girin'),
    }),
    onSubmit: async (values) => {
      if (isEdit) {
        const updateUser = {
          id: contact._id,
          tckn: values.tckn,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          gender: values.gender,
          password: values.password,
          confirmPassword: values.confirmPassword,
          type: "Admin",
          
         
        };
        dispatch(onUpdateUser(updateUser));
        
        validation.resetForm();
 
        try {
 
          const token = JSON.parse(localStorage.getItem("authUser"));
          console.log("selam",contact.id);
          const response = await axios.post(`{YourAPILink}${contact.id}`, updateUser, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              },
            }
          );
    
          if (response.status === 200) {
            toast.success("Yönetici başarıyla veri tabanında güncellendi.");
          } else {
            toast.error("Veri tabanında güncelleme sırasında bir hata oluştu.");
          }
        } catch (error) {
          toast.error("Veri tabanında güncellenirken bir hata oluştu:", error);
        }
        setIsEdit(false);
      } else {
        const newUser = {
          id: Math.floor(Math.random() * (30 - 20)) + 20,
          tckn: values["tckn"],
          firstName: values["firstName"],
          lastName: values["lastName"],
          phone: values["phone"],
          gender: values["gender"],
          password: values["password"],
          confirmPassword: values["confirmPassword"],
          type: "Admin",
          
        };
        dispatch(onAddNewUser(newUser));
        validation.resetForm();
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.post('{YourAPILink}', newUser, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              },
            }
          );
          
          if (response.status === 200) {
            toast.success("Yönetici başarıyla veri tabanına kaydedildi.");
          } else {
            toast.error("Veri tabanına kaydetme sırasında bir hata oluştu.");
          }
        } catch (error) {
          toast.error("Veri tabanına kaydedilirken bir hata oluştu:", error);
        }
      }
      
      toggle();
    },
  });

  const ContactsProperties = createSelector(
    (state) => state.contacts,
    (Contacts) => ({
      users: Contacts.users,
      loading: Contacts.loading,
    })
  );

  const { users, loading } = useSelector(ContactsProperties);

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setLoading] = useState(loading);

  useEffect(() => {
    if (users && !users.length) {
      dispatch(onGetUsers());
      setIsEdit(false);
    }
  }, [dispatch, users]);

  useEffect(() => {
    setContact(users);
    setIsEdit(false);
  }, [users]);

  useEffect(() => {
    if (!isEmpty(users) && !!isEdit) {
      setContact(users);
      setIsEdit(false);
    }
  }, [users]);

  const toggle = () => {
    setModal(!modal);
  };

  const handleUserClick = (arg) => {
    const user = arg;

    setContact({
      id: user.id || user._id,
      tckn: user.tckn,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      gender: user.gender,
      password: user.password,
      type: "Admin",
      
    });
    setIsEdit(true);
    toggle();
  };

  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (user) => {
    setContact({ id: user._id});
    setDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    console.log("Current contact:", contact); 
    if (contact && contact.id) {
      dispatch(onDeleteUser(contact.id));
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.delete(
          `{YourAPILink}${contact.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200) {
          console.log("Yönetici başarıyla veri tabanından silindi.");
        } else {
          console.error("Veri tabanından silme sırasında bir hata oluştu.");
        }
      } catch (error) {
        console.error("Veri tabanından silinirken bir hata oluştu:", error);
      }
    }
    setDeleteModal(false);
  };

  const handleUserClicks = () => {
    setContact("");
    setIsEdit(false);
    toggle();
  };

  const allContacts = useMemo(() => {
    const uniqueContacts = [...(users || []), ...(externalContacts || [])];
    const uniqueTCKNs = new Set();
    return uniqueContacts
      .filter(contact => contact && contact.tckn && contact.firstName && contact.lastName)
      .filter(contact => contact.type === "Admin")
      .filter(contact => {
        if (uniqueTCKNs.has(contact.tckn)) {
          return false;
        }
        uniqueTCKNs.add(contact.tckn);
        return true;
      });
  }, [users, externalContacts]);

  const columns = useMemo(
    () => [
      {
        header: "T.C. Kimlik No",
        accessorKey: "tckn",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Ad/Soyad",
        accessorKey: "firstName",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return (
            <>
              <h5 className="font-size-14 mb-1">
                <Link to="#" className="text-dark">
                  {`${cell.row.original.firstName} ${cell.row.original.lastName}`}
                </Link>
              </h5>
              <p className="text-muted mb-0">{cell.row.original.type}</p>
            </>
          );
        },
      },
      {
        header: "Telefon",
        accessorKey: "phone",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Cinsiyet",
        accessorKey: "gender",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Yönetici Tipi",
        cell: () => <span>Okul Yöneticisi</span>,
        enableColumnFilter: false,
        enableSorting: false,
      },
      
      {
        header: "İşlem",
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              <Link
                to="#"
                className="text-success"
                onClick={() => {
                  const userData = cellProps.row.original;
                  handleUserClick(userData);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const userData = cellProps.row.original;
                  onClickDelete(userData);
                }}
              >
                <i className="mdi mdi-delete font-size-18" id="deletetooltip" />
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteUser}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Kişiler" breadcrumbItem="Yönetici Listesi" />
          <Row>
            {isLoading ? (
              <Spinners setLoading={setLoading} />
            ) : (
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={allContacts}
                      isGlobalFilter={true}
                      isPagination={true}
                      SearchPlaceholder="Ara..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={handleUserClicks}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="Yeni Yönetici"
                      tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      pagination="pagination"
                    />
                  </CardBody>
                </Card>
              </Col>
            )}
            <Modal isOpen={modal} toggle={toggle}>
              <ModalHeader toggle={toggle} tag="h4">
                {!!isEdit ? "Yöneticiyi Düzenle" : "Yönetici Ekle"}
              </ModalHeader>
              <ModalBody>
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                  }}
                >
                  <Row>
                    <Col xs={12}>
                      <div className="mb-3">
                        <Label className="form-label">T.C. Kimlik No</Label>
                        <Input
                          name="tckn"
                          type="text"
                          placeholder="T.C. Kimlik No Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.tckn || ""}
                          invalid={
                            validation.touched.tckn && validation.errors.tckn
                              ? true
                              : false
                          }
                        />
                        {validation.touched.tckn && validation.errors.tckn ? (
                          <FormFeedback type="invalid">
                            {validation.errors.tckn}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Adı</Label>
                        <Input
                          name="firstName"
                          type="text"
                          placeholder="Adı Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.firstName || ""}
                          invalid={
                            validation.touched.firstName && validation.errors.firstName
                              ? true
                              : false
                          }
                        />
                        {validation.touched.firstName && validation.errors.firstName ? (
                          <FormFeedback type="invalid">
                            {validation.errors.firstName}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Soyadı</Label>
                        <Input
                          name="lastName"
                          type="text"
                          placeholder="Soyadı Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.lastName || ""}
                          invalid={
                            validation.touched.lastName && validation.errors.lastName
                              ? true
                              : false
                          }
                        />
                        {validation.touched.lastName && validation.errors.lastName ? (
                          <FormFeedback type="invalid">
                            {validation.errors.lastName}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Telefon</Label>
                        <Input
                          name="phone"
                          type="text"
                          placeholder="Telefon Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.phone || ""}
                          invalid={
                            validation.touched.phone && validation.errors.phone
                              ? true
                              : false
                          }
                        />
                        {validation.touched.phone && validation.errors.phone ? (
                          <FormFeedback type="invalid">
                            {validation.errors.phone}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                      <Label className="form-label">Cinsiyet</Label>
                        <Input
                          type="select"
                          name="gender"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.gender || ""}
                          invalid={validation.touched.gender && validation.errors.gender ? true : false}
                        >
                          <option value="">Bir cinsiyet seçin</option>
                          <option value="Kadın">Kadın</option>
                          <option value="Erkek">Erkek</option>
                        </Input>
                        {validation.touched.gender && validation.errors.gender ? (
                          <FormFeedback type="invalid">{validation.errors.gender}</FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Kullanıcı Tipi</Label>
                        <Input
                          type="select"
                          name="userType"
                          onChange={(e) => validation.setFieldValue("userType", e.target.value)}
                          onBlur={validation.handleBlur}
                          value={validation.values.userType || ""}
                          invalid={validation.touched.userType && validation.errors.userType ? true : false}
                        >
                          <option value="">Kullanıcı Tipini Seçiniz</option>
                          <option value="Okul Sahibi">Okul Sahibi</option>
                          <option value="Admin">Admin</option>
                        </Input>
                        {validation.touched.userType && validation.errors.userType ? (
                          <FormFeedback type="invalid">
                            {validation.errors.userType}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Şifre</Label>
                        <Input
                          name="password"
                          type="password"
                          placeholder="Şifre Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.password || ""}
                          invalid={
                            validation.touched.password && validation.errors.password
                              ? true
                              : false
                          }
                        />
                        {validation.touched.password && validation.errors.password ? (
                          <FormFeedback type="invalid">
                            {validation.errors.password}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Şifreyi Tekrar Girin</Label>
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="Şifreyi Tekrar Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.confirmPassword || ""}
                          invalid={
                            validation.touched.confirmPassword && validation.errors.confirmPassword
                              ? true
                              : false
                          }
                        />
                        {validation.touched.confirmPassword && validation.errors.confirmPassword ? (
                          <FormFeedback type="invalid">
                            {validation.errors.confirmPassword}
                          </FormFeedback>
                        ) : null}
                      </div>
                      
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <div className="text-end">
                        <button
                          type="submit"
                          className="btn btn-success save-user"
                        >
                          Kaydet
                        </button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </ModalBody>
            </Modal>
          </Row>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default withRouter(ContactsListYonetici);
