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
import axios from 'axios';

const ContactsList = () => {

  // Meta başlık
  document.title = "Kullanıcı Listesi | Skote - React Yönetici & Gösterge Tablosu Şablonu";

  const dispatch = useDispatch();
  const [contact, setContact] = useState();
  const [externalContacts, setExternalContacts] = useState([]);  // MongoDB'den gelecek kişileri tutacak state
  const [isDataFetched, setIsDataFetched] = useState(false);  // Verilerin sadece bir defa çekilmesini sağlamak için

  // MongoDB'den kişiler çekmek için useEffect kullanıyoruz, sadece ilk yüklemede veri çekilecek
  useEffect(() => {
    if (!isDataFetched) {
      const fetchExternalContacts = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/contacts');
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
      name: (contact && contact.name) || "",
      designation: (contact && contact.designation) || "",
      tags: (contact && contact.tags) || "",
      email: (contact && contact.email) || "",
      projects: (contact && contact.projects) || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Lütfen adınızı girin"),
      designation: Yup.string().required("Lütfen unvanınızı girin"),
      tags: Yup.array().required("Lütfen etiket girin"),
      email: Yup.string()
        .matches(
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
          "Lütfen geçerli bir e-posta girin"
        )
        .required("Lütfen e-postanızı girin"),
      projects: Yup.string().required("Lütfen projenizi girin"),
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateUser = {
          id: contact.id,
          name: values.name,
          designation: values.designation,
          tags: values.tags,
          email: values.email,
          projects: values.projects,
        };
        // Kullanıcıyı güncelle
        dispatch(onUpdateUser(updateUser));
        setIsEdit(false);
        validation.resetForm();
      } else {
        const newUser = {
          id: Math.floor(Math.random() * (30 - 20)) + 20,
          name: values["name"],
          designation: values["designation"],
          email: values["email"],
          tags: values["tags"],
          projects: values["projects"],
        };
        // Yeni kullanıcı kaydet
        dispatch(onAddNewUser(newUser));
        validation.resetForm();
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
      id: user.id,
      name: user.name,
      designation: user.designation,
      email: user.email,
      tags: user.tags,
      projects: user.projects,
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

  // Tabloda hem Redux'taki kullanıcılar hem de MongoDB'den gelen kullanıcılar birleştiriliyor
  const allContacts = useMemo(() => {
    const uniqueContacts = [...(users || []), ...(externalContacts || [])];
    // Aynı kullanıcıları filtrele (örneğin, email benzersizse email ile karşılaştırabiliriz)
    const uniqueEmails = new Set();
    return uniqueContacts.filter(contact => {
      if (uniqueEmails.has(contact.email)) {
        return false;
      }
      uniqueEmails.add(contact.email);
      return true;
    });
  }, [users, externalContacts]);

  const columns = useMemo(
    () => [
      {
        header: "#",
        accessorKey: "img",
        cell: (cell) => (
          <>
            {!cell.getValue() ? (
              <div className="avatar-xs">
                <span className="avatar-title rounded-circle">
                  {cell.row.original.name.charAt(0)}
                </span>
              </div>
            ) : (
              <div>
                <img
                  className="rounded-circle avatar-xs"
                  src={cell.getValue()}
                  alt=""
                />
              </div>
            )}
          </>
        ),
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Adı",
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return (
            <>
              <h5 className="font-size-14 mb-1">
                <Link to="#" className="text-dark">
                  {cell.getValue()}
                </Link>
              </h5>
              <p className="text-muted mb-0">{cell.row.original.designation}</p>
            </>
          );
        },
      },
      {
        header: "E-posta",
        accessorKey: "email",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Etiketler",
        accessorKey: "tags",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return (
            <div>
              {cell.getValue()?.map((item, index) => (
                <Link
                  to="#1"
                  className="badge badge-soft-primary font-size-11 m-1"
                  key={index}
                >
                  {item}
                </Link>
              ))}
            </div>
          );
        },
      },
      {
        header: "Projeler",
        accessorKey: "projects",
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
          {/* Breadcrumb'ı Görüntüle */}
          <Breadcrumbs title="Kişiler" breadcrumbItem="Kullanıcı Listesi" />
          <Row>
            {isLoading ? (
              <Spinners setLoading={setLoading} />
            ) : (
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={allContacts}  // Redux ve MongoDB'den gelen tüm kişiler
                      isGlobalFilter={true}
                      isPagination={true}
                      SearchPlaceholder="Ara..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={handleUserClicks}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="Yeni Kişi"
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
                {!!isEdit ? "Kullanıcıyı Düzenle" : "Kullanıcı Ekle"}
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
                        <Label className="form-label">Adı</Label>
                        <Input
                          name="name"
                          type="text"
                          placeholder="Adı Girin"
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
                        <Label className="form-label">Unvan</Label>
                        <Input
                          name="designation"
                          label="Unvan"
                          placeholder="Unvanı Girin"
                          type="text"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.designation || ""}
                          invalid={
                            validation.touched.designation &&
                            validation.errors.designation
                              ? true
                              : false
                          }
                        />
                        {validation.touched.designation &&
                        validation.errors.designation ? (
                          <FormFeedback type="invalid">
                            {validation.errors.designation}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">E-posta</Label>
                        <Input
                          name="email"
                          label="E-posta"
                          type="email"
                          placeholder="E-postayı Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email
                              ? true
                              : false
                          }
                        />
                        {validation.touched.email &&
                        validation.errors.email ? (
                          <FormFeedback type="invalid">
                            {validation.errors.email}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Seçenek</Label>
                        <Input
                          type="select"
                          name="tags"
                          className="form-select"
                          multiple={true}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.tags || []}
                          invalid={
                            validation.touched.tags && validation.errors.tags
                              ? true
                              : false
                          }
                        >
                          <option>Photoshop</option>
                          <option>Illustrator</option>
                          <option>Html</option>
                          <option>Php</option>
                          <option>Java</option>
                          <option>Python</option>
                          <option>UI/UX Tasarımcısı</option>
                          <option>Ruby</option>
                          <option>Css</option>
                        </Input>
                        {validation.touched.tags && validation.errors.tags ? (
                          <FormFeedback type="invalid">
                            {validation.errors.tags}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label className="form-label">Projeler</Label>
                        <Input
                          name="projects"
                          label="Projeler"
                          type="text"
                          placeholder="Projeleri Girin"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.projects || ""}
                          invalid={
                            validation.touched.projects &&
                            validation.errors.projects
                              ? true
                              : false
                          }
                        />
                        {validation.touched.projects &&
                        validation.errors.projects ? (
                          <FormFeedback type="invalid">
                            {validation.errors.projects}
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

export default withRouter(ContactsList);
