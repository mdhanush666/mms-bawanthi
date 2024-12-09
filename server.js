const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require("path");
const cors = require('cors');

const dotenv = require('dotenv');

dotenv.config({path:path.join(__dirname,'config.env')});

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.DB)
.then(()=>{
  console.log("db success");
})

const regMemberSchema = new mongoose.Schema({
  membership_id : {type: String},
  name : {type:String},
  mobile_num : {type: String},
  nic : {type:String},
  dob : {type:String},
  gender : {type:String},
  outlet_name : {type:String},
  outlet_code : {type:String},
  address : {type:String},
  city : {type:String},
  ref_num : {type:String},
  email_id : {type:String},
  name_of_bank : {type:String},
  branch : {type:String},
  bank_acc : {type:String},
  date: {type:Date, default:Date.now}
});
const regMemberModel = mongoose.model('regMemberDetail', regMemberSchema);


const OutletSchema = new mongoose.Schema({
  names: Array,
});
const Outlet = mongoose.model('Outlet', OutletSchema);


const BranchSchema = new mongoose.Schema({
  names: Array,
});
const Branch = mongoose.model('Branch', BranchSchema);


const BankSchema = new mongoose.Schema({
  names: Array,
});
const Bank = mongoose.model('bank', BankSchema);


const  setPaymentRateSchema = new mongoose.Schema({
  rate : {type:String},
});
const setPaymentRateModel = mongoose.model('paymentRate', setPaymentRateSchema);


const  qrCountSchema = new mongoose.Schema({
  membership_id : String,
  qr_count : Number,
  qr_data : [{
    type: Object
  }]
});
const qrCountModel = mongoose.model('qrCount', qrCountSchema);


const paymentDetailsSchema = new mongoose.Schema({
  payment_id : {type: String},
  membership_id : {type: String},
  voucher_id : {type:String},
  rate : {type:String},
  paid_amount : {type: String},
  date: {type:Date, default:Date.now}
});
const paymentDetailsModel = mongoose.model('paymentDetail', paymentDetailsSchema);


const  paymentNotifySchema = new mongoose.Schema({
  membership_id : {type:String},
  rate : {type:String},
  qr_count : {type:String},
  total_amount : {type:String},
  payments : [{
    type: Object,
      ref : 'paymentDetail'
  }],
  due_amount : {type:String},
  date: {type:Date, default:Date.now}
});
const paymentNotifyModel = mongoose.model('paymentNotify', paymentNotifySchema);


//Api build pandrom


app.post('/reg_member', async (req, res) => {
  
  try {
    const member = new regMemberModel({
      membership_id:req.body.membership_id,
      name : req.body.name,
      mobile_num : req.body.mobile_num,
      nic : req.body.nic,
      dob : req.body.dob,
      gender : req.body.gender,
      outlet_name : req.body.outlet_name,
      outlet_code : req.body.outlet_code,
      address : req.body.address,
      city : req.body.city,
      ref_num : req.body.ref_num,
      email_id : req.body.email_id,
      name_of_bank : req.body.name_of_bank,
      branch : req.body.branch, 
      bank_acc : req.body.bank_acc,
    });

    member.save();
    res.status(200).send(member);

  } catch (error) {
    console.error('Error saving Member data:', error);
    res.status(500).send({ error: 'Server error while saving Members data.' });
  }
});


app.get('/get-members', async(req, res) => {
  let memberDetails = await regMemberModel.find({});
  console.log(memberDetails.length);
  memberDetails.length !== 0 ? res.status(200).send(memberDetails): res.status(201).send(null);
});


app.get('/get-outlets', async (req, res) => {
  try {
    const outlets = await Outlet.find();
    res.json(outlets);
  } catch (error) {
    // res.status(500).json({ error: 'Failed to fetch outlets' });
    res.status(500).send(Outlet);
  }
});


app.get('/get-branches', async (req, res) => {
  try {
    const branch = await Branch.find();
    res.json(branch);
  } catch (error) {
    res.status(500).send(Branch);
  }
});


app.get('/get-banks', async (req, res) => {
  try {
    const bank = await Bank.find();
    res.json(bank);
  } catch (error) {
    res.status(500).send(Bank);
  }
});


app.post('/set-payment-amount', async (req, res) => {
  try {
  
    const rateAmount = new setPaymentRateModel({
      rate : req.body.rate
    });

    console.log(rateAmount);
    
    rateAmount.save();

    res.status(200).send(rateAmount);

  } catch (error) {
    console.error('Error saving QR data:', error);
    res.status(500).send({ error: 'Server error while saving QR data.' });
  }
});


app.post('/fetchAll/:id', async (req, res) => {
  try {

    const { id } = req.params;
    const { qr_data } = req.body;

    let data = await regMemberModel.find({ membership_id: id });
    let data2 = await qrCountModel.find({ membership_id: id });

    console.log(data);
    

    if (data.length == 0) {
      // const newData = new qrCountModel({
      //   membership_id: id,
      //   qr_count: 1,
      //   qr_data: [qr_data],
      // });
      // await newData.save();
      res.status(404).send('Data not found');
    } else{

      if (data2.length == 0) {
        const newData = new qrCountModel({
          membership_id: id,
          qr_count: 1,
          qr_data: [qr_data],
        });
        await newData.save();
      } else{
        const existingRecord = data2[0];
        const updatedCount = existingRecord.qr_count + 1;
  
        await qrCountModel.findByIdAndUpdate(existingRecord._id, {
          qr_count: updatedCount,
          $push: { qr_data: qr_data },
        });
      }

    }

    res.status(200).send('Success');
  }
  catch (error) {
    res.status(500).send('Server error while saving QR data', error);
  }
});


app.post('/set-payment-details', async (req, res) => {
  try {

    const {membership_id} = req.body;
    const getRegMemberId = await regMemberModel.find({ membership_id: membership_id });

    console.log(membership_id);
    console.log(getRegMemberId);
    

    if (getRegMemberId.length == 0) {
     res.status(404).send('Data not Found!');
    } else {

      const payment = new paymentDetailsModel({
        payment_id : req.body.payment_id,
        membership_id : req.body.membership_id,
        voucher_id : req.body.voucher_id,
        rate : req.body.rate,
        paid_amount : req.body.paid_amount
      });
  
      payment.save();
      res.status(200).send(payment);
    }
    
    
  } catch (error) {
    console.error('Error saving payment data:', error);
    res.status(500).send({ error: 'Server error while saving payment data.' });
  }
});


app.get('/get-payment-details', async(req, res) => {
  let paymentDetails = await paymentDetailsModel.find({});
  paymentDetails.length !== 0 ? res.status(200).send(paymentDetails): res.status(201).send(paymentDetails);
});


app.get('/get-rate-detail', async(req, res) => {
  
  let getRate = await setPaymentRateModel.find({}); 
  
  let rate = getRate[getRate.length-1].rate;
  
  res.status(200).send(rate);
});


app.get('/get-qr-count/:id', async (req, res) => {
  const {id} = req.params;

  try {
    let qrCountDetail = await qrCountModel.find({membership_id : id})  
    let {qr_count} = qrCountDetail[0];

    res.status(200).json({
      data: qr_count
    })
    
  } catch (error) {
    console.log("Error"); 
  }
})


app.post('/set-payment-notify', async (req, res) => {
  try {

    const {membership_id} = req.body;
    const getPaymentNotify = await paymentNotifyModel.find({membership_id : membership_id});

    

    if (getPaymentNotify.length == 0) {
      
      const setPaymentNotify = new paymentNotifyModel({
        membership_id : req.body.membership_id,
        rate : req.body.rate,
        qr_count : req.body.qr_count,
        total_amount : req.body.total_amount,
        payments : req.body.payments,
        due_amount : req.body.due_amount,
      });
  
      await setPaymentNotify.save();
      return res.status(200).send(setPaymentNotify);
    } 
    else {

      const getPaymentNotify = await paymentNotifyModel.find({membership_id : membership_id});      
      let getPaidAmount = getPaymentNotify[0].payments;

      if (getPaidAmount.length > 0) {
        const lastPaidAmount = getPaidAmount[getPaidAmount.length - 1].paid_amount;
        console.log(`Last Paid Amount: ${lastPaidAmount}`);
      } else {
        console.log('No payments found.');
      }    

      await paymentNotifyModel.updateOne(
        {membership_id:membership_id},
        {$set: {
          rate : req.body.rate,
          qr_count : req.body.qr_count,
          total_amount : req.body.total_amount,
          payments : req.body.payments,
          due_amount : req.body.due_amount,
        }}
      )
    }
    
  } catch (error) {
    console.error('Error saving payment data:', error);
    res.status(500).send({ error: 'Server error while saving payment data.' });
  }
});


app.get('/get-payment-notify/:id', async (req, res) => {

  const {id} = req.params;

  try {
    let paymentNotifyDetail = await paymentDetailsModel.find({membership_id : id})
    let data = paymentNotifyDetail;
    let element = [{}];

    for (let index = 0; index < data.length; index++) {
      element[index] = {
        "payment_id":data[index].payment_id,
        "voucher_id":data[index].voucher_id,
        "paid_amount":data[index].paid_amount,
      }
    }
    
    res.status(200).json(element)
    
  } catch (error) {
    console.log("Error"); 
  }
})


app.get('/get-reg-member-detail', async (req, res) => {
  const {id} = req.params;

  try {
    let getRegMemberDetails = await regMemberModel.find({})  
    res.status(200).send({getRegMemberDetails})
  } catch (error) {
    console.log("Error");
  }
});


app.get('/get-payment-notify-detail/:id', async (req, res) => {
  const {id} = req.params;

  try {
    let temp1 = await paymentNotifyModel.find({membership_id : id}) 
    const getPaymentDetails = temp1[temp1.length-1]
    res.status(200).send({getPaymentDetails})
  } catch (error) {
    console.log("Error"); 
  }
});


app.get('/get-one-member-detail/:id', async (req, res) => {
  const {id} = req.params;

  try {
    let getOneMemberDetails = await regMemberModel.findOne({membership_id : id})  
    res.status(200).send({getOneMemberDetails})

  } catch (error) {
    console.log("Error"); 
  }
});


app.delete('/delete-payment-detail/:id', async (req, res) => {
  const {id} = req.params;

  try {
    let getOneMemberDetails = await paymentDetailsModel.find({membership_id : id});

    let data = getOneMemberDetails[getOneMemberDetails.length-1]._id.toString();
    
    await paymentDetailsModel.deleteOne({_id : data});
    
    res.status(200).send({getOneMemberDetails})

  } catch (error) {
    console.log("Error"); 
  }
});


app.get('/get-membership-ids', async (req, res) => {
  try {
    const members = await regMemberModel.find({}, 'membership_id');
    
    res.status(200).json({
      data: members.map(member => member.membership_id),
    });
  } catch (error) {
    console.error('Error fetching membership_ids:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/get-msg', (req, res) => {
    res.send("Hiiii!");
});


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
