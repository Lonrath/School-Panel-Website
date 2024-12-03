import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
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
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import axios from 'axios';
import { Toast } from "bootstrap";

const ContactsListVeli = () => {
  // Meta başlık
  document.title = "Veli Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [studentsNames, setStudentsNamesState] = useState([]);
  const [getChoiceSUBDOMAIN, setChoiceSUBDOMAIN] = useState(null);

  const [getChoiceStudentId, setChoiceStudentId] = useState(null);
  const [getChoiceSchoolId, setChoiceSchoolId] = useState(null);

  

  // Öğrenci isimlerini MongoDB'den çekiyoruz
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("authUser"));

    const fetchStudentsData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setStudentsNamesState(response.data);
      } catch (error) {
        console.error("Öğrenci verilerini çekerken bir hata oluştu!", error);
      }
    };

    // Sayfa açılır açılmaz MongoDB'den öğrenci verilerini çek
    fetchStudentsData();
    
  }, []);

  // MongoDB'den kişiler çekmek için useEffect kullanıyoruz, sadece ilk yüklemede veri çekilecek
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
      students: "",
      school:"",
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

          tckn: values.tckn,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          gender: values.gender,
          password: values.password,
          confirmPassword:values.confirmPassword,
          type: "Parent",  
          students: [getChoiceStudentId], 
          school: getChoiceSchoolId,
        };
        
        dispatch(onUpdateUser(updateUser));

        validation.resetForm();

        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.patch(`{YourAPILink}/${contact.id}`, updateUser, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              },
            }
          );
          
          console.log("Güncelleme yanıtı:", response);

          if (response.status === 200) {
            toast.success("Veli başarıyla veri tabanına kaydedildi.");
          } else {
            toast.error("Veri tabanına kaydetme sırasında bir hata oluştu.");
          }
        } catch (error) {
          toast.error("Veri tabanına kaydedilirken bir hata oluştu:", error);
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
          type: "Parent",  
          students: [getChoiceStudentId],
          school: getChoiceSchoolId,
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
            toast.success("Veli başarıyla veri tabanına kaydedildi.");
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

  const toggle = () => {
    setModal(!modal);
  };

  const handleUserClick = (userData) => {
    console.log("Selected user data:", userData);

    setContact({
      id: userData.id || userData._id, // Make sure to use either `id` or `_id` if `id` doesn’t exist
      tckn: userData.tckn,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      gender: userData.gender,
      password: userData.password,  
      type: "Parent",  
      students: userData.students[0] || "", 
    });
    console.log("Contact set with ID:", userData.id || userData._id); // Confirm contact ID
    setIsEdit(true);
    toggle();
  };

  const handleStudentChange = (event) => {
    const selectedStudentId = event.target.value;
    setChoiceSUBDOMAIN(selectedStudentId); // Seçilen değeri sakla
    validation.setFieldValue("students", selectedStudentId); // Formik'in students alanını güncelle
  };

  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (user) => {
    console.log("User to delete:", user); // Debugging output
    setContact({ id: user._id }); // Set contact to match the structure { id: ... }
    setDeleteModal(true);
  };
  

  const handleDeleteUser = async () => {
    console.log("Attempting to delete user:", contact); // Log contact object
  
    if (contact && contact.id) {
      console.log("Deleting user with ID:", contact.id); // Confirm if ID is present
  
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
          toast.success("Veli başarıyla veri tabanından silindi.");
        } else {
          toast.error("Veri tabanından silme sırasında bir hata oluştu.");
        }
      } catch (error) {
        toast.error("Veri tabanından silinirken bir hata oluştu:", error);
      }
    } else {
      console.warn("No user ID found for deletion.");
    }
    setDeleteModal(false);
  };

  const handleUserClicks = () => {
    setContact("");
    setIsEdit(false);
    toggle();
  };

  const studentOptions = studentsNames.map(student => ({
    value: {
      studentId: student._id,
      schoolId: student.school._id
    },
        label: `${student.firstName} ${student.lastName}`
  }));

  const allContacts = useMemo(() => {
    const uniqueContacts = [...(users || []), ...(externalContacts || [])];
    const uniqueTCKNs = new Set();
    return uniqueContacts
      .filter(contact => contact && contact.tckn && contact.firstName && contact.lastName)
      .filter(contact => contact.type === "Parent")
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
        header: "Öğrenci",
        accessorKey: "students",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const studentArray = cell.row.original.students;
          const studentName = studentArray && studentArray.length > 0 
            ? `${studentArray[0].firstName} ${studentArray[0].lastName}`
            : "Belirtilmemiş";
          return (
            <span>{studentName}</span>
          );
        },
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
          <Breadcrumbs title="Kişiler" breadcrumbItem="Veli Listesi" />
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
                      buttonName="Yeni Veli"
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
                {!!isEdit ? "Veliyi Düzenle" : "Veli Ekle"}
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
                        <Label className="form-label">Şifre</Label>
                        <Input
                          name="password"
                          type="password"
                          placeholder="Şifrenizi girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.password}
                          invalid={validation.touched.password && validation.errors.password}
                        />
                        {validation.touched.password && validation.errors.password && (
                          <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                        )}
                      </div>

                      {/* Şifre Tekrar */}
                      <div className="mb-3">
                        <Label className="form-label">Şifre Tekrar</Label>
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="Şifrenizi tekrar girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.confirmPassword}
                          invalid={validation.touched.confirmPassword && validation.errors.confirmPassword}
                        />
                        {validation.touched.confirmPassword && validation.errors.confirmPassword && (
                          <FormFeedback type="invalid">{validation.errors.confirmPassword}</FormFeedback>
                        )}
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
                        <Label className="form-label">Öğrenci</Label>
                        <Select
                          name="students"
                          options={studentOptions} // Öğrenci seçenekleri burada geliyor
                          onChange={(selectedOption) => {
                            console.log("şlmsdşlf",selectedOption)
                            setChoiceStudentId(selectedOption ? selectedOption.value.studentId : null);
                            setChoiceSchoolId(selectedOption ? selectedOption.value.schoolId : null);

                            validation.setFieldValue("students", selectedOption ? selectedOption.value : ""); // Formik alanını güncelle
                          }}
                          value={studentOptions.find(option => option.value === getChoiceSUBDOMAIN)}
                          placeholder="Bir öğrenci seçin veya arayın..." // Arama işlevi için placeholder
                          isClearable
                          isSearchable // Arama işlevini aktif hale getiriyoruz
                        />
                        {validation.touched.students && validation.errors.students ? (
                          <FormFeedback type="invalid">{validation.errors.students}</FormFeedback>
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
                  <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
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

export default withRouter(ContactsListVeli);
