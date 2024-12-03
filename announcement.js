import React, { useEffect, useState } from "react";
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
  Input,
  Form,
  Button,
  Table
} from "reactstrap";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useFormik } from "formik";
import * as Yup from "yup";
import Breadcrumbs from "components/Common/Breadcrumb";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";

const Announcement = () => {
  document.title = "Duyurular | Skote - React Yönetici & Gösterge Tablosu Şablonu";
  
  const [announcements, setAnnouncements] = useState([]);
  const [externalContacts, setExternalContacts] = useState([]); // Okulları tutan durum
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [modal, setModal] = useState(false);

  const toggle = () => {
    setModal(!modal);
  };

  // Duyuruları API'den çekme
  useEffect(() => {
    const fetchAnnouncementData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("authUser"));
        const response = await axios.get('{YourAPILink}', {
          
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAnnouncements(response.data);
      } catch (error) {
        console.error("Announcement data fetch error!", error);
      }
    };
    fetchAnnouncementData();
  }, []);

  // Okulları API'den çekme
  useEffect(() => {
    if (!isDataFetched) {
      const fetchExternalContacts = async () => {
        try {
          const token = JSON.parse(localStorage.getItem("authUser"));
          const response = await axios.get(
            "{YourAPILink}",
            // your API can allow notifications when a new announcement is added
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setExternalContacts(response.data); // Okulları state'e ekle
          setIsDataFetched(true);
        } catch (error) {
          console.error("Okulları çekerken bir hata oluştu!", error);
        }
      };

      fetchExternalContacts();
    }
  }, [isDataFetched]);

  // Formik ve Yup ile form doğrulaması ve gönderimi
  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      date: new Date(),
      school: ""
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Başlık gereklidir"),
      description: Yup.string().required("Açıklama gereklidir"),
      school: Yup.string().required("Okul seçimi gereklidir")
    }),
    onSubmit: async (values) => {
      const newAnnouncement = {
        title: values.title,
        description: values.description,
        date: values.date.toISOString().split("T")[0], // Tarihi uygun formata çevir
        school: values.school
      };

      try {
        const token = JSON.parse(localStorage.getItem("authUser"));

        const response = await axios.post(
          "{YourAPILink}",
          newAnnouncement,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 200) {
          toast.success("Duyuru başarıyla veri tabanına kaydedildi.");
          setAnnouncements((prev) => [newAnnouncement, ...prev]); // Yeni duyuruyu listeye ekle
        } else {
          toast.error("Veri tabanına kaydetme sırasında bir hata oluştu.");
        }
      } catch (error) {
        toast.error("Veri tabanına kaydedilirken bir hata oluştu:", error);
      }

      toggle();
      formik.resetForm();
    },
  });

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Ana Sayfa" breadcrumbItem="Duyurular" />

        <Row>
          <Col lg="12">
            <Card>
              <CardBody>
                <div className="d-flex justify-content-between mb-4">
                  <h4 className="card-title">Duyuru Listesi</h4>
                  <Button color="success" onClick={toggle}>
                    Yeni Duyuru Ekle
                  </Button>
                </div>
                
                <Table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Başlık</th>
                      <th>Açıklama</th>
                      <th>Tarih</th>
                      <th>Okul</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((announcement, index) => {
                      const school = externalContacts.find(
                        (school) => school._id === announcement.school
                      );
                      const schoolName = school ? school.name : "Okul Yok";

                      return (
                        <tr key={announcement._id}>
                          <th scope="row">{index + 1}</th>
                          <td>{announcement.title}</td>
                          <td>{announcement.description}</td>
                          <td>
                            {announcement.date
                              ? `${announcement.date.substring(8, 10)}.${announcement.date.substring(5, 7)}.${announcement.date.substring(0, 4)}`
                              : "Tarih Yok"}
                          </td>
                          <td>{schoolName}</td>
                          <td>
                            <Button color="primary" size="sm" onClick={toggle}>Düzenle</Button>{" "}
                            <Button color="danger" size="sm">Sil</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Yeni Duyuru Ekle Modal */}
        <Modal isOpen={modal} toggle={toggle}>
          <ModalHeader toggle={toggle}>Yeni Duyuru Ekle</ModalHeader>
          <ModalBody>
            <Form onSubmit={formik.handleSubmit}>
              <div className="mb-3">
                <Label>Başlık</Label>
                <Input
                  type="text"
                  name="title"
                  placeholder="Başlık girin"
                  onChange={formik.handleChange}
                  value={formik.values.title}
                  invalid={formik.touched.title && !!formik.errors.title}
                />
              </div>
              <div className="mb-3">
                <Label>Açıklama</Label>
                <Input
                  type="textarea"
                  name="description"
                  placeholder="Açıklama girin"
                  onChange={formik.handleChange}
                  value={formik.values.description}
                  invalid={formik.touched.description && !!formik.errors.description}
                />
              </div>
              <div className="mb-3">
                <Label>Tarih</Label>
                <DatePicker
                  selected={formik.values.date}
                  onChange={(date) => formik.setFieldValue("date", date)}
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <Label>Okul Seç</Label>
                <Input
                  type="select"
                  name="school"
                  onChange={formik.handleChange}
                  value={formik.values.school}
                  invalid={formik.touched.school && !!formik.errors.school}
                >
                  <option value="">Okul Seçiniz</option>
                  {externalContacts.map((school) => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                    </option>
                  ))}
                </Input>
              </div>
              <div className="text-end">
                <Button color="primary" type="submit">Kaydet</Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>
      </Container>
    </div>
  );
};

export default Announcement;
