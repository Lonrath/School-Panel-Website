import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import withRouter from "components/Common/withRouter";
import { toast } from "react-toastify";
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

// Breadcrumb'ı İçe Aktar
import Breadcrumbs from "components/Common/Breadcrumb";
import DeleteModal from "components/Common/DeleteModal";

import {
  getUsers as onGetUsers,
  addNewUser as onAddNewUser,
  updateUser as onUpdateUser,
  deleteUser as onDeleteUser,
} from "store/contacts/actions";
import { isEmpty } from "lodash";

// Redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import Spinners from "components/Common/Spinner";
import { ToastContainer } from "react-toastify";
import axios from 'axios';

const ContactsListOgretmen = () => {

  // Meta başlık
  document.title = "Öğretmen Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]);  // MongoDB'den gelecek kişileri tutacak state
  const [isDataFetched, setIsDataFetched] = useState(false);  // Verilerin sadece bir defa çekilmesini sağlamak için
  const [schoolNames, setSchoolNamesState] = useState([]);  // Okul isimlerini tutacak state
  const [getChoiceSUBDOMAIN, setChoiceSUBDOMAIN] = useState(null);

  // Okul isimlerini MongoDB'den çekiyoruz
  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const schools = response.data;
        
        setSchoolNamesState(schools);  // Okul verilerini state'e atıyoruz
      } catch (error) {
        console.error("Okul verilerini çekerken bir hata oluştu!", error);
      }
    };

    // Sayfa açılır açılmaz MongoDB'den okul verilerini çek
    fetchSchoolData();
  }, []);

  // MongoDB'den kişiler çekmek için useEffect kullanıyoruz, sadece ilk yüklemede veri çekilecek
  useEffect(() => {
    if (!isDataFetched) {
      const fetchExternalContacts = async () => {
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.get('{YourAPILink}', {
            headers: {
              'Authorization': `Bearer ${token}` // Bearer Token ekleme
            }
          });
          setExternalContacts(response.data);  // MongoDB'den gelen kişileri state'e ekle
          setIsDataFetched(true);  // Verilerin bir defa çekildiğini işaretle
        } catch (error) {
          console.error("Kişileri çekerken bir hata oluştu!", error);
        }
      };

      fetchExternalContacts();
    }
  }, [isDataFetched]);

  // Doğrulama
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
      school: "",  // Okul başlangıçta boş, kullanıcı seçecek
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
          id: contact.id,
          tckn: values.tckn,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          gender: values.gender,
          password: values.password,  // Güncellenen şifre de ekleniyor
          type: "Teacher",  // Kullanıcı tipi otomatik olarak Teacher
          school: values.school,  // Kullanıcı seçtiği okulu alacak
        };
        // Kullanıcıyı güncelle
        dispatch(onUpdateUser(updateUser));
        setIsEdit(false);
        validation.resetForm();
      } else {
        const newUser = {
          id: Math.floor(Math.random() * (30 - 20)) + 20,
          tckn: values["tckn"],
          firstName: values["firstName"],
          lastName: values["lastName"],
          phone: values["phone"],
          gender: values["gender"],
          password: values["password"],
          confirmPassword: values["confirmPassword"],  // Yeni şifre ekleniyor
          type: "Teacher",  // Kullanıcı tipi öğretmen
          school: parseInt(getChoiceSUBDOMAIN),  // Okul kullanıcı seçimiyle dolacak
        };
        // Yeni kullanıcı kaydet
        dispatch(onAddNewUser(newUser));
        validation.resetForm();
        try {
          // Token'i localStorage'dan alın
          const token = JSON.parse(localStorage.getItem("authUser"));
    
          const response = await axios.post('{YourAPILink}', newUser, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              },
            }
          );
    
          if (response.status === 200) {
            console.log("Öğretmen başarıyla veri tabanına kaydedildi.");
          } else {
            console.error("Veri tabanına kaydetme sırasında bir hata oluştu.");
          }
        } catch (error) {
          console.error("Veri tabanına kaydedilirken bir hata oluştu:", error);
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
      password: user.password,  // Şifreyi de alıyoruz
      type: "Teacher",  // Kullanıcı tipi öğretmen
      school: user.school,
      lessons: user.lessons, // Ders sayısını almak için ekliyoruz
    });
    setIsEdit(true);

    toggle();
  };

  // Kullanıcı silme
  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (users) => {
    setContact(users.id);
    setDeleteModal(true);
  };

  const handleDeleteUser = () => {
    if (contact && contact.id) {
      dispatch(onDeleteUser(contact.id));
    }
    setDeleteModal(false);
  };

  const handleUserClicks = () => {
    setContact("");
    setIsEdit(false);
    toggle();
  };

  const _setChoiceSUBDOMAIN = arg => {
    setChoiceSUBDOMAIN(arg.target.value)
    console.log("lk123kl",arg.target.value)
   }

  // Tabloda hem Redux'taki kullanıcılar hem de MongoDB'den gelen kullanıcılar birleştiriliyor
  const allContacts = useMemo(() => {
    const uniqueContacts = [...(users || []), ...(externalContacts || [])];
    const uniqueTCKNs = new Set();
    return uniqueContacts
      .filter(contact => contact && contact.tckn && contact.firstName && contact.lastName)
      .filter(contact => contact.type === "Teacher")
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
        header: "Ders",
        accessorKey: "lessons",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          const lessonCount = cell.row.original.lessons ? cell.row.original.lessons.length : 0;
          return (
            <p className="mb-0">
              {lessonCount} {lessonCount === 1 ? "ders" : "ders"}
            </p>
          );
        },
      },
      {
        header: "Okul",
        accessorKey: "school.name",
        enableColumnFilter: false,
        enableSorting: true,
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
          <Breadcrumbs title="Kişiler" breadcrumbItem="Öğretmen Listesi" />
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
                      buttonName="Yeni Öğretmen"
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
                {!!isEdit ? "Öğretmeni Düzenle" : "Öğretmen Ekle"}
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
                      <div className="mb-3">
                        <Label className="form-label">Okul</Label>
                        <Input
                          type="select"
                          name="school"
                          onChange={(text) => _setChoiceSUBDOMAIN(text)}
                          value={getChoiceSUBDOMAIN}
                          invalid={
                            validation.touched.school && validation.errors.school
                              ? true
                              : false
                          }
                        >
                          <option value="">Bir okul seçin</option>
                          {schoolNames.map((school, index) => (
                            <option key={index} value={school._id}>{school.name}</option>
                          ))}
                        </Input>
                        {validation.touched.school && validation.errors.school ? (
                          <FormFeedback type="invalid">
                            {validation.errors.school}
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

export default withRouter(ContactsListOgretmen);
