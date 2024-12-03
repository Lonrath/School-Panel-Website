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
  addNewUser as onAddNewUser,
  updateUser as onUpdateUser,
  deleteUser as onDeleteUser,
} from "store/contacts/actions";
import { isEmpty } from "lodash";

// Redux
import { useSelector, useDispatch } from "react-redux";
import Spinners from "components/Common/Spinner";
import { ToastContainer } from "react-toastify";
import axios from "axios";

const ContactsListOkul = () => {
  // Meta başlık
  document.title = "Okul Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]); // MongoDB'den gelecek okulları tutacak state
  const [isDataFetched, setIsDataFetched] = useState(false); // Verilerin sadece bir defa çekilmesini sağlamak için
/*
  const [adminNames, setAdminNamesState] = useState([]); // Admin işlemleri
  const [getChoiceADMIN, setChoiceADMIN] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const admins = response.data;
        
        setSchoolAdminState(admins);  // Yönetici verilerini state'e atıyoruz
      } catch (error) {
        console.error("Yönetici verilerini çekerken bir hata oluştu!", error);
      }
    };

    // Sayfa açılır açılmaz MongoDB'den yönetici verilerini çek
    fetchAdminData();
  }, []); */

  // MongoDB'den okullar çekmek için useEffect kullanıyoruz, sadece ilk yüklemede veri çekilecek
  useEffect(() => {
    if (!isDataFetched) {
      const fetchExternalContacts = async () => {
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.get(
            "{YourAPILink}",
            {
              headers: {
                Authorization: `Bearer ${token}`, // Bearer Token ekleme
              },
            }
          );
          setExternalContacts(response.data); // MongoDB'den gelen okulları state'e ekle
          setIsDataFetched(true); // Verilerin bir defa çekildiğini işaretle
        } catch (error) {
          console.error("Okulları çekerken bir hata oluştu!", error);
        }
      };

      fetchExternalContacts();
    }
  }, [isDataFetched]);

  // Doğrulama
  const validation = useFormik({
    enableReinitialize: true,

    initialValues: {
      name: (contact && contact.name) || "",
      address: (contact && contact.address) || "",
      phone: (contact && contact.phone) || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Lütfen okulun adını girin"),
      address: Yup.string().required("Lütfen adresi girin"),
      phone: Yup.string().required("Lütfen telefon numarasını girin"),
    }),
    onSubmit: async (values) => {
      if (isEdit) {
        const updateSchool = {
          id: contact.id,
          name: values.name,
          address: values.address,
          phone: values.phone,
        };

        try {
          const token = JSON.parse(localStorage.getItem("authUser"));

          const response = await axios.post( `{YourAPILink}${contact.id}`, updateSchool,
            {
              headers: {
                Authorization: `Bearer ${token}`, 

              },
            }
          );

          if (response.status === 200) {
            toast.success("Okul başarıyla veri tabanında güncellendi.");
            
            setExternalContacts((prevContacts) => [newSchool, ...prevContacts]);
          } else {
            toast.error("Veri tabanında güncellenme sırasında bir hata oluştu.");
          }
        } catch (error) {
          toast.error("Veri tabanında güncellenirken bir hata oluştu:", error);
        }
  
        dispatch(onUpdateUser(updateSchool));
        setIsEdit(false);
        validation.resetForm();
      } else {
        const newSchool = {
          id: Math.floor(Math.random() * (30 - 20)) + 20,
          name: values.name,
          address: values.address,
          phone: values.phone,
          type: "School"
        };
        // Yeni okul kaydet
        dispatch(onAddNewUser(newSchool));
        validation.resetForm();
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));

          const response = await axios.post( "{YourAPILink}", newSchool,
            {
              headers: {
                Authorization: `Bearer ${token}`, 

              },
            }
          );

          if (response.status === 200) {
            toast.success("Okul başarıyla veri tabanına kaydedildi.");
            
            setExternalContacts((prevContacts) => [newSchool, ...prevContacts]);
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

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const toggle = () => {
    setModal(!modal);
  };

  const handleUserClick = (userData) => {
    
    console.log("Selected user data:", userData);
    setContact({
      id: userData.id || userData._id,
      name: userData.name,
      address: userData.address,
      phone: userData.phone,
    });
    setIsEdit(true);

    toggle();
  };

  // Okul silme
  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (school) => {
    setContact({ id: school._id });
    setDeleteModal(true);
  };

  const handleDeleteUser = async () => {

    if (contact && contact.id) {
      dispatch(onDeleteUser(contact.id));
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        console.log("kaaaaan",contact.id);
        const response = await axios.delete(
          `{YourAPILink}${contact.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200) {
          console.log("Okul başarıyla veri tabanından silindi.");
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

  // Sadece MongoDB'den gelen okulları gösteren tablo
  const allContacts = useMemo(() => externalContacts, [externalContacts]);

  const columns = useMemo(
    () => [
      {
        header: "Okul Adı",
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return (
            <>
              <h5 className="font-size-14 mb-1">
                <Link to="#" className="text-dark">
                  {cell.row.original.name}
                </Link>
              </h5>
              <p className="text-muted mb-0">{cell.row.original.address}</p>
            </>
          );
        },
      },
      {
        header: "Adres",
        accessorKey: "address",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Telefon",
        accessorKey: "phone",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Yetkili",
        accessorKey: "admin",
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
                  const schoolData = cellProps.row.original;
                  handleUserClick(schoolData);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const schoolData = cellProps.row.original;
                  onClickDelete(schoolData);
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
          <Breadcrumbs title="Kişiler" breadcrumbItem="Okul Listesi" />
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
                      buttonName="Yeni Okul"
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
                {!!isEdit ? "Okulu Düzenle" : "Okul Ekle"}
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
                        <Label className="form-label">Okul Adı</Label>
                        <Input
                          name="name"
                          type="text"
                          placeholder="Okul Adı Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.name || ""}
                          invalid={
                            validation.touched.name && validation.errors.name
                              ? true
                              : false
                          }
                        />
                        {validation.touched.name && validation.errors.name ? (
                          <FormFeedback type="invalid">
                            {validation.errors.name}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Adres</Label>
                        <Input
                          name="address"
                          type="text"
                          placeholder="Adres Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.address || ""}
                          invalid={
                            validation.touched.address && validation.errors.address
                              ? true
                              : false
                          }
                        />
                        {validation.touched.address && validation.errors.address ? (
                          <FormFeedback type="invalid">
                            {validation.errors.address}
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

export default withRouter(ContactsListOkul);
