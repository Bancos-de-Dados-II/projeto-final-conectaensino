import dotenv from 'dotenv';
import { connectMongoDB } from '../config/mongo';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';

dotenv.config();

const seedMonitors = async () => {
  await connectMongoDB();

  await MonitorProfile.deleteMany({});

  const mockMonitors = [
    {
      userId: "11111111-1111-1111-1111-111111111111", 
      disciplinasAtendidas: ["math-01", "port-01"],
      location: {
        type: 'Point',
        coordinates: [-38.5583, -6.8875] 
      }
    },
    {
      userId: "22222222-2222-2222-2222-222222222222",
      disciplinasAtendidas: ["math-01"],
      location: {
        type: 'Point',
        coordinates: [-38.5650, -6.8910] 
      }
    },
    {
      userId: "33333333-3333-3333-3333-333333333333",
      disciplinasAtendidas: ["hist-01"],
      location: {
        type: 'Point',
        coordinates: [-38.5400, -6.8700] 
      }
    }
  ];

  await MonitorProfile.insertMany(mockMonitors);
  console.log("🌱 Monitores de teste inseridos com sucesso no MongoDB!");
  process.exit(0);
};

seedMonitors();