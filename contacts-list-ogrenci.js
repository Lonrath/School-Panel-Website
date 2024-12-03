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
import axios from "axios";

const ContactsListOgrenci = () => {
  // Meta başlık
  document.title = "Öğrenci Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]); // MongoDB'den gelecek öğrencileri tutacak state
  const [isDataFetched, setIsDataFetched] = useState(false); // Verilerin sadece bir defa çekilmesini sağlamak için
  const [schoolNames, setSchoolNamesState] = useState([]); // Okul isimlerini tutacak state
  const [getChoiceSUBDOMAIN, setChoiceSUBDOMAIN] = useState(null);
  const [assigned_classNames, setAssigned_classNamesState] = useState([]); // Sınıf isimlerini tutacak state
  const [getChoiceASSIGNED_CLASS, setChoiceASSIGNED_CLASS] = useState(null);

  const [sectionNames, setSectionNamesState] = useState([]); // Sınıf isimlerini tutacak state
  const [getChoiceSECTION, setChoiceSECTION] = useState(null);

  // Okul ve Şube isimlerini MongoDB'den çekiyoruz
  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSchoolNamesState(response.data); // Okul verilerini state'e atıyoruz
      } catch (error) {
        console.error("Okul verilerini çekerken bir hata oluştu!", error);
      }
    };
    
    const fetchAssigned_classData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAssigned_classNamesState(response.data); // Şube/Sınıf verilerini state'e atıyoruz
      } catch (error) {
        console.error("Sınıf verilerini çekerken bir hata oluştu!", error);
      }
    };

    const fetchSectionData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSectionNamesState(response.data); // Şube/Sınıf verilerini state'e atıyoruz
      } catch (error) {
        console.error("Şube verilerini çekerken bir hata oluştu!", error);
      }
    };

    fetchSectionData();
    fetchSchoolData();
    fetchAssigned_classData();
  }, []);


  
  // MongoDB'den öğrencileri çekmek için useEffect kullanıyoruz, sadece ilk yüklemede veri çekilecek
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
          setExternalContacts(response.data); // MongoDB'den gelen öğrencileri state'e ekle
          setIsDataFetched(true); // Verilerin bir defa çekildiğini işaretle
        } catch (error) {
          console.error("Öğrencileri çekerken bir hata oluştu!", error);
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
      school: "", // Okul başlangıçta boş, kullanıcı seçecek
      assigned_class: "", // Yeni Sınıf/Şube alanı
      section:"",
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
          password: values.password,
          type: "Student", // Kullanıcı tipi otomatik olarak Student
          school: parseInt(getChoiceSUBDOMAIN), // Okul kullanıcı seçimiyle dolacak
          assigned_class: parseInt(getChoiceASSIGNED_CLASS), // Sınıf/Şube bilgisi
          section: parseInt(getChoiceSECTION),
        }
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
          confirmPassword: values["confirmPassword"],
          type: "Student",
          school: parseInt(getChoiceSUBDOMAIN),
          assigned_class: parseInt(getChoiceASSIGNED_CLASS),
          section: parseInt(getChoiceSECTION),
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
            console.log("Öğrenci başarıyla veri tabanına kaydedildi.");
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

  const toggle = () => {
    setModal(!modal);
  };

  const handleUserClick = (arg) => {
    const user = arg;

    setContact({
      id: user.id,
      tckn: user.tckn,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      gender: user.gender,
      password: user.password,
      type: "Student",
      school: user.school,
      assigned_class: user.assigned_class,
      section: user.section,
    });
    setIsEdit(true);
    toggle();
  };

  const _setChoiceSUBDOMAIN = (arg) => {
    setChoiceSUBDOMAIN(arg.target.value);
  };
  
  const _setChoiceSECTION = (arg) => {
    console.log("SELAM BEN KAAN");
    setChoiceSECTION(arg.target.value);
  };

  const _setChoiceASSIGNED_CLASS = (arg) => {
    console.log("dsfaskdf");
    setChoiceASSIGNED_CLASS(arg.target.value);
  };

  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (user) => {
    setContact(user.id);
    setDeleteModal(true);
  };

  const handleDeleteUser = async () => {
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
          console.log("Öğrenci başarıyla veri tabanından silindi.");
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
      .filter(contact => contact.type === "Student")
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
        header: "Sınıf",
        accessorKey: "assigned_class",
        cell: ({ cell }) => {
          // Eğer section bir object ise ve name alanını barındırıyorsa
          return cell.getValue() && cell.getValue().title
            ? cell.getValue().title
            : "Bilinmeyen";
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Şube",
        accessorKey: "section",
        cell: ({ cell }) => {
          // Eğer section bir object ise ve name alanını barındırıyorsa
          return cell.getValue() && cell.getValue().title
            ? cell.getValue().title
            : "Bilinmeyen";
        },
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
          <Breadcrumbs title="Kişiler" breadcrumbItem="Öğrenci Listesi" />
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
                      buttonName="Yeni Öğrenci"
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
                {!!isEdit ? "Öğrenciyi Düzenle" : "Öğrenci Ekle"}
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
                          name="gender"
                          type="select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.gender || ""}
                          invalid={
                            validation.touched.gender && validation.errors.gender
                              ? true
                              : false
                          }
                        >
                          <option value="">Bir cinsiyet seçin</option>
                          <option value="Kadın">Kadın</option>
                          <option value="Erkek">Erkek</option>
                        </Input>
                        {validation.touched.gender && validation.errors.gender ? (
                          <FormFeedback type="invalid">
                            {validation.errors.gender}
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
                      <div className="mb-3">
                        <Label className="form-label">Sınıf</Label>
                        <Input
                          name="assigned_class"
                          type="select"
                          placeholder="Sınıf/Şube Girin"
                          onChange={_setChoiceASSIGNED_CLASS}
                          value={getChoiceASSIGNED_CLASS}
                          invalid={
                            validation.touched.assigned_class && validation.errors.assigned_class
                              ? true
                              : false
                          }
                        >
                          <option value="">Bir sınıf seçin</option>
                          {assigned_classNames.map((assigned_class, index) => (
                            <option key={index} value={assigned_class._id}>{assigned_class.title}</option>
                          ))}
                        </Input>
                        {validation.touched.assigned_class && validation.errors.assigned_class ? (
                          <FormFeedback type="invalid">
                            {validation.errors.assigned_class}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Şube</Label>
                        <Input
                          name="section"
                          type="select"
                          placeholder="Şube Girin"
                          onChange={_setChoiceSECTION}
                          value={getChoiceSECTION}
                          invalid={
                            validation.touched.section && validation.errors.section
                              ? true
                              : false
                          }
                        >
                          <option value="">Bir sınıf/şube seçin</option>
                          {sectionNames.map((section, index) => (
                            <option key={index} value={section._id}>{section.title}</option>
                          ))}
                        </Input>
                        {validation.touched.section && validation.errors.section ? (
                          <FormFeedback type="invalid">
                            {validation.errors.section}
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

export default withRouter(ContactsListOgrenci);
