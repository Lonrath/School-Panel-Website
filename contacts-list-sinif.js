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
  Button,
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
import axios from 'axios';

const ContactsListSinif = () => {
  document.title = "Sınıf Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [schoolNames, setSchoolNamesState] = useState([]);
  const [getChoiceSUBDOMAIN, setChoiceSUBDOMAIN] = useState(null);

  const [scheduleModal, setScheduleModal] = useState(false); // Yeni modal state
  const [selectedClassId, setSelectedClassId] = useState(null); // Seçilen sınıf ID'si

  const [mondayLesson, setMondayLesson] = useState("Matematik"); // Pazartesi günü dersi
  
  const toggleScheduleModal = () => setScheduleModal(!scheduleModal); // Haftalık saat tablosu modalini aç/kapat
  
  const [schedule, setSchedule] = useState({}); // Haftalık ders programı için state

  const handleAddLesson = (classId, lessonCount) => {
    // Ders sayısına göre programı oluştur
    const initialSchedule = Array.from({ length: 8 }, (_, i) => {
      return i === 0 && lessonCount === 1 ? "Matematik" : "Örnek Ders";
    });
  
    setSchedule({ ...schedule, [classId]: initialSchedule });
    setSelectedClassId(classId); // Seçilen sınıf ID'sini sakla
    toggleScheduleModal(); // Modalı aç
  };
  
  const handleDeleteLesson = (classId) => {
    // Pazartesi 8-9 saatini "Örnek Ders" olarak güncelle
    setSchedule((prevSchedule) => ({
      ...prevSchedule,
      [classId]: prevSchedule[classId].map((lesson, i) =>
        i === 0 ? "Örnek Ders" : lesson
      ),
    }));
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSchoolNamesState(response.data);
      } catch (error) {
        console.error("School data fetch error!", error);
      }
    };
    fetchSchoolData();
  }, []);

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
          console.error("Contacts fetch error!", error);
        }
      };
      fetchExternalContacts();
    }
  }, [isDataFetched]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: (contact && contact.title) || "",
      level: (contact && contact.level) || "",
      section: "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Lütfen sınıf adını girin"),
      level: Yup.string().required("Lütfen sınıf seviyesini girin"),
      section: Yup.string().required("Lütfen şube seçin"),
    }),
    onSubmit: async (values) => {
      // Şube'nin ilk harfini alıyoruz
      const selectedSectionInitial = values.section.charAt(0);
  
      if (isEdit) {
        const updateUser = {
          id: contact.id,
          title: values.title,
          level: values.level,
          section: selectedSectionInitial, // İlk harfi doğrudan buraya atıyoruz
        };
        dispatch(onUpdateUser(updateUser));
        setIsEdit(false);
        validation.resetForm();

        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.post('{YourAPILink}', updateUser, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          response.status === 200 ? console.log("Class saved successfully") : console.error("Error saving class");
        } catch (error) {
          toastr.error("Error saving class:", error);
        }

      } else {
        const newUser = {
          id: Math.floor(Math.random() * (30 - 20)) + 20,
          title: values.title,
          level: values.level,
          section: selectedSectionInitial, // İlk harfi doğrudan buraya atıyoruz
        };
        dispatch(onAddNewUser(newUser));
        validation.resetForm();
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.post('{YourAPILink}', newUser, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          response.status === 200 ? console.log("Class saved successfully") : console.error("Error saving class");
        } catch (error) {
          toastr.error("Error saving class:", error);
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

  const toggle = () => {
    setModal(!modal);
  };

  const handleUserClick = (arg) => {
    const user = arg;
    setContact({
      id: user.id,
      title: user.title,
      level: user.level,
      section: user.sections[0] || "",
      student: user.sections[0] || "",
      school: user.school,
      lessons: user.sections[0]?.lessons?.length || 0,
    });
    setIsEdit(true);
    toggle();
  };

  const handleSectionChange = (event) => {
    const selectedSectionId = event.target.value;
    setChoiceSUBDOMAIN(selectedSectionId);
    validation.setFieldValue("section", selectedSectionId);
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
        const response = await axios.delete(`{YourAPILink}${contact.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        response.status === 200 ? console.log("Class deleted successfully") : console.error("Error deleting class");
      } catch (error) {
        console.error("Error deleting class:", error);
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
    const uniqueIDs = new Set();
    return uniqueContacts
      .filter(contact => contact && contact.title && contact.level)
      .filter(contact => {
        if (uniqueIDs.has(contact._id)) {
          return false;
        }
        uniqueIDs.add(contact._id);
        return true;
      });
  }, [users, externalContacts]);

  const columns = useMemo(
    () => [
      { header: "Sınıf Adı", accessorKey: "title",enableSorting: true,enableColumnFilter: false  },
      { 
        header: "Şube Adı", 
        accessorKey: "section", 
        enableSorting: true, 
        enableColumnFilter: false,
        cell: (cell) => {
          const sectionArray = cell.row.original.sections;
          // İlk elemanın `title` veya `id` gibi bir özelliğini render edelim
          return sectionArray && sectionArray.length > 0 ? sectionArray[0].title || sectionArray[0]._id : "YOK";
        }
      },
      { header: "Öğrenci",
         accessorKey: "student" ,
         enableSorting: true,
         enableColumnFilter: false,
         cell: (cell) => {
          const sectionArray = cell.row.original.sections;
          // İlk elemanın `title` veya `id` gibi bir özelliğini render edelim
          return sectionArray && sectionArray.length > 0 ? sectionArray[0].title || sectionArray[0]._id : "YOK";
        }
        },
      { 
        header: "Okul Adı", 
        accessorKey: "school.name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return cell.getValue() || "YOK";
        }
      },
        {
          header: "Ders",
          accessorKey: "lessons",
          enableColumnFilter: false,
          enableSorting: true,
          cell: (cell) => {
              const lessonCount = cell.row.original.sections?.[0]?.lessons?.length || 0;
              return (
                  <div className="d-flex align-items-center">
                      <p className="mb-0">{lessonCount} ders</p>
                      <button
                          onClick={() => handleAddLesson(cell.row.original.id, lessonCount)}
                          className="btn btn-sm btn-outline-primary ms-2"
                      >
                          +
                      </button>
                  </div>
              );
          },
      },
      {
        header: "İşlem",
        enableColumnFilter: false ,
        enableSorting: true,
        cell: (cellProps) => (
          <div className="d-flex gap-3">
            <Link to="#" className="text-success" onClick={() => handleUserClick(cellProps.row.original)}>
              <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
            </Link>
            <Link to="#" className="text-danger" onClick={() => onClickDelete(cellProps.row.original)}>
              <i className="mdi mdi-delete font-size-18" id="deletetooltip" />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <React.Fragment>
      <DeleteModal show={deleteModal} onDeleteClick={handleDeleteUser} onCloseClick={() => setDeleteModal(false)} />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Kişiler" breadcrumbItem="Sınıf Listesi" />
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
                      buttonName="Yeni Sınıf"
                      tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      pagination="pagination"
                    />
                      <Button
                        color="primary"
                        className="ms-2"
                        onClick={() => {/* Yeni Şube işlemlerini buraya ekleyin */}}
                      >
                        Yeni Şube
                     </Button>
                  </CardBody>
                </Card>
              </Col>
            )}
                      {/* Haftalık Saat Tablosu Modal */}
<Modal isOpen={scheduleModal} toggle={toggleScheduleModal} style={{ maxWidth: "700px" }}>
  <ModalHeader toggle={toggleScheduleModal}>Haftalık Saat Tablosu</ModalHeader>
  <ModalBody>
    <table className="table table-bordered">
      <thead>
        <tr>
          <th>Saat</th>
          <th>Pazartesi</th>
          <th>Salı</th>
          <th>Çarşamba</th>
          <th>Perşembe</th>
          <th>Cuma</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 8 }, (_, i) => (
          <tr key={i}>
            <td>{`${i + 8}:00 - ${i + 9}:00`}</td>
            <td>
              {schedule[selectedClassId]?.[i] || "Örnek Ders"}
              {i === 0 && schedule[selectedClassId]?.[i] === "Matematik" && (
                <Button
                  color="danger"
                  size="sm"
                  className="ms-2"
                  onClick={() => handleDeleteLesson(selectedClassId)}
                >
                  -
                </Button>
              )}
            </td>
            <td>Örnek Ders</td>
            <td>Örnek Ders</td>
            <td>Örnek Ders</td>
            <td>Örnek Ders</td>
          </tr>
        ))}
      </tbody>
    </table>
  </ModalBody>
</Modal>
<Modal isOpen={modal} toggle={toggle}>
  <ModalHeader toggle={toggle} tag="h4">
    {!!isEdit ? "Sınıfı Düzenle" : "Sınıf Ekle"}
  </ModalHeader>
  <ModalBody>
    <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); return false; }}>
      <Row>
        <Col xs={12}>
          {/* Sınıf Adı */}
          <div className="mb-3">
            <Label className="form-label">Sınıf Adı</Label>
            <Input 
              name="title" 
              type="text" 
              placeholder="Sınıf Adı Girin" 
              onChange={validation.handleChange} 
              onBlur={validation.handleBlur} 
              value={validation.values.title || ""} 
              invalid={validation.touched.title && validation.errors.title ? true : false} 
            />
            {validation.touched.title && validation.errors.title ? (
              <FormFeedback type="invalid">{validation.errors.title}</FormFeedback>
            ) : null}
          </div>

          {/* Sınıf Seçiniz */}
          <div className="mb-3">
            <Label className="form-label">Sınıf Seçiniz</Label>
            <Input 
              type="select" 
              name="level" 
              onChange={validation.handleChange} 
              onBlur={validation.handleBlur} 
              value={validation.values.level || ""} 
              invalid={validation.touched.level && validation.errors.level ? true : false} 
            >
              <option value="">Bir sınıf seçin</option>
              {[...Array(12).keys()].map(i => (
                <option key={i + 1} value={`${i + 1}. Sınıf`}>{`${i + 1}. Sınıf`}</option>
              ))}
              <option value="Mezun">Mezun</option>
            </Input>
            {validation.touched.level && validation.errors.level ? (
              <FormFeedback type="invalid">{validation.errors.level}</FormFeedback>
            ) : null}
          </div>

          {/* Şube Seçiniz */}
          <div className="mb-3">
            <Label className="form-label">Şube Seçiniz</Label>
            <Input 
              type="select" 
              name="section" 
              onChange={validation.handleChange} 
              onBlur={validation.handleBlur} 
              value={validation.values.section || ""} 
              invalid={validation.touched.section && validation.errors.section ? true : false} 
            >
              <option value="">Bir şube seçin</option>
              {Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                <option key={letter} value={`${letter} Şubesi`}>{`${letter} Şubesi`}</option>
              ))}
            </Input>
            {validation.touched.section && validation.errors.section ? (
              <FormFeedback type="invalid">{validation.errors.section}</FormFeedback>
            ) : null}
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="text-end">
            <button type="submit" className="btn btn-success save-user">Kaydet</button>
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

export default withRouter(ContactsListSinif);
