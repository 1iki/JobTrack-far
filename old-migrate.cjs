require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const defaultData = {
  name: "Fachri Aditya Rizky",
  title: "IT Developer Support Intern",
  email: "fachri.adityarizky@gmail.com",
  phone: "+6283878261179",
  location: "Depok, Jawa Barat",
  about: "- Memiliki kemampuan berpikir kreatif dan imajinatif dalam menyesuaikan solusi dengan perkembangan teknologi serta kebutuhan pengguna (user experience).\n- Mampu bekerja dengan sabar dan tetap tenang di bawah tekanan, serta memiliki komitmen untuk terus belajar dan mengembangkan kemampuan secara berkelanjutan.",
  profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  experiences: [
    { id: "1", title: "IT Developer Support Intern", company: "PT. Penerbit Erlangga", period: "Jan 2026 - Apr 2026", description: "" },
    { id: "2", title: "Staff Library Intern", company: "Universitas Mercu Buana", period: "Oct 2024 - Apr 2025", description: "" },
    { id: "3", title: "Asisten Laboratorium Fakultas Ilmu Komputer", company: "Universitas Mercu Buana", period: "Feb 2024 - Feb 2025", description: "" },
    { id: "4", title: "Outbound Telemarketer", company: "CIMB Niaga", period: "Aug 2020 - Nov 2021", description: "" },
    { id: "5", title: "Web Content Writer", company: "MajalahOtaku.com", period: "Sep 2018 - Mar 2020", description: "" }
  ],
  education: [
    { id: "1", degree: "Teknik Informatika", school: "Universitas Mercu Buana Jakarta", period: "Sep 2022 - Aug 2026", description: "" },
    { id: "2", degree: "IPA (Ilmu Pengetahuan Alam)", school: "SMA Negeri 3 Karawang", period: "Sep 2019 - Mei 2022", description: "" }
  ],
  highestEducation: "S1 Teknik Informatika - Universitas Mercu Buana Jakarta",
  skills: ['Cybersecurity', 'Product Development', 'Maintenance Engineering', 'Web Development', 'Help Desk Support', 'Teamwork', 'Microsoft Office', 'Presentation Skills', 'Router Configuration', 'Customer Service'],
  interests: ["Backend Developer", "Cybersecurity", "Data Engineer", "IT Support", "Network Engineer"],
  portfolio: [
    { title: "fachri-aer.vercel.app", url: "https://fachri-aer.vercel.app" },
    { title: "github.com/1iki", url: "https://github.com/1iki" }
  ],
  socials: [
    { platform: "Resume", url: "a5f72478-9849-4f27-9cdd-27a543e7e627.pdf" }
  ],
  certificates: [
    { id: "1", title: "Samsung Innovation Campus Batch 5", issuer: "Skilvul", period: "Mar 2024" },
    { id: "2", title: "Network Support and Security", issuer: "Cisco Networking Academy", period: "Jun 2024" },
    { id: "3", title: "CCNA: Enterprise Networking Security and automation III", issuer: "Cisco Networking Academy", period: "Mar 2025" },
    { id: "4", title: "Belajar Dasar-Dasar DevOps", issuer: "Dicoding Indonesia", period: "Jan 2024" }
  ],
  volunteering: [
    { id: "1", role: "Member", organization: "Solidaritas Erlangga", period: "Feb 2024 - Sekarang" },
    { id: "2", role: "Member", organization: "Google Developer Student Club Mercu Buana University", period: "Jun 2023 - Sekarang" },
    { id: "3", role: "Operation", organization: "Asisten Laboratorium Fasilkom Universitas Mercu Buana", period: "Feb 2024 - Feb 2025" }
  ]
};

const profileSchema = new mongoose.Schema({
  name: String, title: String, email: String, phone: String, location: String, about: String, profileImage: String,
  experiences: [ { id: String, title: String, company: String, period: String, description: String } ],
  education: [ { id: String, degree: String, school: String, period: String, description: String } ],
  skills: [String], interests: [String],
  portfolio: [ { title: String, url: String } ],
  socials: [ { platform: String, url: String } ],
  certificates: [{ id: String, title: String, issuer: String, period: String }],
  volunteering: [{ id: String, role: String, organization: String, period: String }]
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

async function migrate() {
  if (!MONGODB_URI) {
    console.log("No MONGODB_URI found");
    process.exit(1);
  }
  console.log('Connecting to MongoDB ("JobTrackerV1")...');
  await mongoose.connect(MONGODB_URI, { dbName: 'JobTrackerV1' });
  console.log("Connected.");
  let profile = await Profile.findOne();
  if (profile) {
    await Profile.updateOne({ _id: profile._id }, defaultData);
    console.log("Profile updated with default data.");
  } else {
    await Profile.create(defaultData);
    console.log("Profile created with default data.");
  }
  await mongoose.disconnect();
}

migrate().catch(console.error);
