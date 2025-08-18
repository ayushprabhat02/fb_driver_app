//dependencies
import {View, Dimensions} from 'react-native';
import React from 'react';
import {ScaledSheet} from 'react-native-size-matters';
import ScrollViewIndicator from 'react-native-scroll-indicator';

//components
import {Container, Text, Divider} from '@/components';
import {FBColors, FBColorPalette, FBBackground} from '@/types/styles';
import {BottomSheetView} from '@gorhom/bottom-sheet';

//component
const TermsConditionsPrivacy: React.FC = () => {
  // const scrollViewRef = React.useRef(null); //@todo: find a workaround to control scroll shile showing scrollbar
  // const [atTop, setAtTop] = useState<boolean>(true);

  // const handleScrollToBottom = () => {
  //   setAtTop(false);
  //   (scrollViewRef.current as any)?.scrollToEnd({animated: true});
  // };
  // const handleScrollToTop = () => {
  //   setAtTop(true);
  //   (scrollViewRef.current as any)?.scrollTo({y: 0, animated: true});
  // };
  const {height} = Dimensions.get('window');

  return (
    <BottomSheetView style={[styles.body, {maxHeight: height * 0.6}]}>
      <View
        style={{
          position: 'relative',
          flex: 1,
          backgroundColor: FBBackground.primary,
          borderTopRightRadius: 10,
          borderTopLeftRadius: 10,
        }}>
        {/* header */}
        <Text size="lg" weight="bold" style={{marginTop: 16, paddingLeft: 20}}>
          FUELBUDDY TERMS OF USE
        </Text>
        <Divider />
        <ScrollViewIndicator
          shouldIndicatorHide={false}
          persistentScrollbar
          scrollIndicatorStyle={{
            backgroundColor: FBBackground.active,
            opacity: 1,
          }}>
          <Container>
            <Text size="base" weight="bold">
              1. SCOPE
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                a.{' '}
              </Text>
              Thank you for using FuelBuddy. These terms hereinafter, are
              intended to make you aware of the respective legal rights and
              responsibilities associated with procurement and use of
              goods/products and services from FuelBuddy ("Services”). These
              ‘Terms of Use’ is formulated and published pursuant to the
              provisions of Rule 3 (1) of the Information Technology
              (Intermediaries Guidelines) Rules, 2011 and other applicable laws
              that requires the publication of rules and regulations, privacy
              policy (‘Privacy Policy’) and Terms of Use for access or usage of
              FuelBuddy Application (‘FuelBuddy Application’). These Terms of
              Use and/or service (“Terms”) together with our Privacy Policy
              govern your use of Fuelbuddy Application including, without
              limitation, and to the extent applicable, the access, review,
              subscription and/or download of the FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                b.{' '}
              </Text>
              Procurement of Services from FuelBuddy can be made through its
              website at https://fuelbuddy.in/ (the{' '}
              <Text size="xs" weight="bold">
                Website
              </Text>
              ) or the FuelBuddy Application, and/or any related mobile or
              software applications including but not limited to delivery of
              information or services whether existing now or in the future that
              link to the Terms. The services obtained by you through the
              Website or the FuelBuddy Application (which may be updated from
              time-to-time) shall mean one and the same.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                c.{' '}
              </Text>
              The FuelBuddy Application and the Website are owned and operated
              by Treis Solutions LLP, a Limited Liability Partnership registered
              under the Limited Liability Partnership Act 2008, having its
              registered office at A-41, Ground Floor, Mohan Cooperative
              Industrial Estate, Mathura Road, New Delhi, 110044.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                d.{' '}
              </Text>
              However, the performance and use of FuelBuddy Application with
              regards to any Privacy Policy is subject to separate terms and
              conditions as presented herewith. Please read the Terms carefully
              before subscribing/using the Services provided by the FuelBuddy
              Application. By accessing or using the FuelBuddy Application, you
              are agreeing to the Terms and concluding a legally binding
              contract with FuelBuddy. You may decline the Terms by choosing not
              to use the FuelBuddy Application. Your use of the FuelBuddy
              application and its services is at your sole risk, including the
              obligations that you might face after availing services from
              FuelBuddy. If you choose to access and/or use the FuelBuddy
              Application, you represent and warrant that you have the authority
              to avail Services and bind yourself to the Terms. For the purposes
              of these Terms{' '}
              <Text size="xs" weight="bold">
                you
              </Text>{' '}
              and{' '}
              <Text size="xs" weight="bold">
                your
              </Text>{' '}
              shall refer to such user. For the avoidance of any doubt, a user
              may be a consumer/customer, who may respectively mean an
              individual, person, company, partnership or a proprietorship firm,
              client, purchaser, principal or agent, all collectively and/or
              separately intended to mean the{' '}
              <Text size="xs" weight="bold">
                User
              </Text>{' '}
              who uses the FuelBuddy Application and who is the recipient of the
              Services procured using the FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                e.{' '}
              </Text>
              For the purposes of these Terms, “FuelBuddy”, “we” or “our” means
              Treis Solutions LLP or FuelBuddy Group and whereas,{' '}
              <Text size="xs" weight="bold">
                FuelBuddy
              </Text>{' '}
              is in the business of providing online-service of door-step
              delivery of fuel for use of private and/ or commercial purposes.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              2. DEFINITIONS
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                a.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "FuelBuddy Application"{' '}
              </Text>
              means the proprietary online Website and/or the mobile based
              FuelBuddy Application of FuelBuddy, wherein the said mobile
              application is available on platforms operating on the Android OS
              and/or iOS, which enables a User to (a) place an order over the
              FuelBuddy Application for the purpose of availing Services; and
              (b) track the status of the order placed by such User; and (c)
              facilitate a provision of payment by the User towards the Services
              obtained from FuelBuddy.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                b.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "Buyer"{' '}
              </Text>
              means the User, as illustrated in Clause 1 (d), who places an
              order to procure Services via FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                c.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "Delivery Model"{' '}
              </Text>
              means doorstep delivery of fuel by FuelBuddy, and its associated
              services and/or products, as the case may be, for an order place
              by a User for commercial purposes with a minimum order quantity of
              20ltrs of Diesel.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                d.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "Fuel"{' '}
              </Text>
              shall mean ready-to-use Diesel of applicable benchmark standards
              for use in vehicles.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                e.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "FuelBuddy Group"{' '}
              </Text>
              shall mean Treis Solutions LLP and its Affiliates, and shall
              include its affiliated partners, distributors and delivery agents.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                f.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "FuelBuddy Affiliate"{' '}
              </Text>
              shall mean any entity that is directly or indirectly Controlled by
              or under the common Control of Treis Solutions LLP. “Control” and
              shall mean the direct or indirect ownership or having a Control of
              more than 50% of the voting interests in the relevant FuelBuddy
              Affiliate and “Controlled” shall be construed accordingly.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                g.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "Product"{' '}
              </Text>
              shall mean the goods and/or services as mentioned in clause 1 (a)
              that are available for sale via FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                h.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "Pick Up Model"{' '}
              </Text>
              means the model whereby User places an order via FuelBuddy
              Application to an associated seller and chooses to pick up the
              product or avail the service on its own accord, from the
              designated location of the Associated Seller.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                i.{' '}
              </Text>
              <Text size="xs" weight="bold">
                "Associated Seller"{' '}
              </Text>
              means the parties offering their products or services via the
              FuelBuddy Application, either under the Pick Up Model or Delivery
              Model, as the case may be, including but not limited to oil
              companies and their recognized refilling stations station,
              electronic vehicle charging and servicing stations, or offering
              any other products and/or services not described in clause 2 (d).
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              3. ACCEPTANCE OF TERMS
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              By accessing and using FuelBuddy Application, you agree to these
              Terms (including Privacy Policy). If you do not agree to Terms,
              you should immediately cease to use of FuelBuddy Application and
              you must not download the FuelBuddy Application. These Terms may
              be changed from time-to-time so you must read these Terms every
              time you access and use FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              By accessing and using FuelBuddy Application, you agree to these
              Terms as also mentioned in clause 1 (d) and the Privacy Policy
              referred hereinafter.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The Terms associated with the Use of FuelBuddy Application are
              binding upon the User unless FuelBuddy notifies you of any
              change(s) to these Terms, or if, FuelBuddy is obliged to make a
              change in these Terms as a result of changes to the applicable
              law.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              4. USE OF FUELBUDDY APPLICATION
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Right to use
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Subject to you complying with these Terms and paying all
              applicable charges, we hereby grant you a limited, non-exclusive,
              non-assignable, non-transferable, non-sub-licensable, revocable,
              right to access and use of FuelBuddy Application for your
              commercial purposes.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Permitted uses
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree not to access or use FuelBuddy Application for purposes
              that are inconsistent with our legitimate business interests or
              which is in breach of applicable law. In particular, you are
              permitted to use FuelBuddy Application only in strict compliance
              with these Terms, not limiting to what is mentioned in clause 2
              (a)-(i), and to obtain information (so long as that information is
              not being gathered for a use in any manner which is or could be
              detrimental to FuelBuddy Group (unless such use is otherwise
              protected by law)); (ii) provide feedback or other constructive
              comments to FuelBuddy Group (which are not scandalous, denigrating
              or defamatory); and/or (iii) review the FuelBuddy Application on
              public platforms or other medium, as the case may be.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              C. Restrictions
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree that you shall not:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Use any "deep-link", "page-scrape", "robot", "spider"
              or other automatic device, program, algorithm or methodology, or
              any similar or equivalent manual process, to access, acquire, copy
              or monitor any portion of the FuelBuddy Application or any
              content, or in any way reproduce or circumvent the navigational
              structure or presentation of the FuelBuddy Application or any
              content, to obtain or attempt to obtain any materials, documents
              or information through any means not purposely made available
              through the FuelBuddy Application and we reserve our right to
              prohibit any such activity;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Attempt to gain unauthorized access to any portion or
              feature of the FuelBuddy Application, or any other systems or
              networks connected to the FuelBuddy Application or to any server,
              computer, network, or to any of the services offered on or through
              the FuelBuddy Application, by hacking, "password mining" or any
              other illegitimate means;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Probe, scan or test the vulnerability of the FuelBuddy
              Application or any network connected to the FuelBuddy Application
              nor breach the security or authentication measures on the
              FuelBuddy Application or any network connected to the FuelBuddy
              Application. You may not reverse look-up, trace or seek to trace
              any information on any other User of or visitor to FuelBuddy
              Application, or any other Buyer, including any account on the
              FuelBuddy Application not owned by you, to its source, or exploit
              the FuelBuddy Application or any service or information made
              available or offered by or through the FuelBuddy Application, in
              any way where the purpose is to reveal any information, including
              but not limited to personal identification or information, other
              than your own information, as provided for by the FuelBuddy
              Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Use any device, software or routine to interfere or
              attempt to interfere with the proper working of the FuelBuddy
              Application or any transaction being conducted on the FuelBuddy
              Application, or with any other person's use of the FuelBuddy
              Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Forge headers or otherwise manipulate identifiers in
              order to disguise the origin of any message or transmittal you
              send to us on or through the FuelBuddy Application or any service
              offered on or through the FuelBuddy Application. You shall not
              misrepresent or impersonate any other individual or entity;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Decompile, disassemble, reverse engineer, decrypt or
              otherwise attempt to derive any source code from FuelBuddy
              Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Modify, adapt or create any derivative applications or
              derivative works of, or from, FuelBuddy Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Destroy or remove any intellectual property,
              confidentiality or other proprietary or legal markings or notices
              on FuelBuddy Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Sell, license, lease, transfer, advertise, access, use
              or distribute FuelBuddy Application to any third- party, except as
              expressly agreed by FuelBuddy in writing;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Upload, post, input, add, transmit, display, store,
              distribute to, or otherwise make available through, FuelBuddy
              Application, content that (i) violates any legal, intellectual
              property rights, confidentiality or privacy rights of others; (ii)
              is inappropriate, inaccurate, illegal, or offensive; or (iii) that
              contains or triggers any viruses, Trojan horses, worms, malware,
              time bombs, cancelbots, corrupted files, or any other similar
              software/spyware, program or device that may be damaging;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Access, use or distribute FuelBuddy Application for
              unlawful, fraudulent, infringing, inappropriate, or any illegal
              purposes;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Extract and/or re-utilise any part of FuelBuddy
              Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Create and/or publish your own database that features
              any part of FuelBuddy Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Be a User expressly barred from availing products and
              services falling under the class/category of products and services
              similarly offered by the FuelBuddy Group, by any Government
              Agency, any Oil-producing and refinery company in India, or who is
              barred by any Court Order;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Alter, add or remove any copyright, trademark or other
              proprietary notices from any portion of the FuelBuddy Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Link to mirror or frame any portion of the Application;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Making a false claim to obtain a right to use FuelBuddy
              Application; or
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Solicit the performance of any illegal activity or
              other activity that infringes the rights of FuelBuddy Application
              and/or others.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Further, FuelBuddy Group shall have all the rights to take
              necessary action and claim damages that may occur due to your
              involvement/participation in any way on your own or through
              group(s) of people, intentionally or unintentionally in any
              DoS/DDoS (Distributed Denial of Services), pen-testing attempts to
              the FuelBuddy Application and the FuelBuddy Group’s associated
              website(s)
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Furthermore, User shall at all times ensure full compliance with
              the applicable provisions, as amended from time to time, of (a)
              the Information Technology Act, 2000 and the rules thereunder; (b)
              the Digital Personal Data Protection Act, 2023; and (c) all
              applicable domestic laws, rules and regulations regarding your use
              of the FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              D. Compliance with laws
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree to comply with all applicable laws while accessing and
              using FuelBuddy Application.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              5. YOUR ACCOUNT
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You may need to create your own account ("Account”) to use
              FuelBuddy Application and you may be required to log into your
              Account to make a payment from a list of RBI-authorized payment
              systems/methods. If there is a problem processing a payment
              through your selected payment method, we may allow you any other
              valid payment methods associated with your Account as said further
              in these Terms.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You are responsible for maintaining the ownership, and
              confidentiality of your Account, including and not limited to
              username and password for use of the FuelBuddy Application, and
              also restrict unauthorized access and use of your Account by any
              third-party. You agree to ACCEPT RESPONSIBILITY FOR ALL ACTIVITIES
              THAT OCCUR UNDER YOUR ACCOUNT. You shall take appropriate
              preventive steps if you have any reason to believe that your
              username and/or password has become known to anyone else, or if
              the username and/or password is being, or is likely to be used in
              an un-authorised or illegal manner.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You are responsible for ensuring that the details given by you
              (and each of your authorised users) to us are correct, accurate
              and complete and, shall update us regarding any subsequent change,
              and illustratively being name and address of delivery of Service.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You must not use your Account or FuelBuddy Application: (i) in any
              way that causes, or is likely to cause, FuelBuddy Application, or
              any access to it, to be interrupted, damaged or impaired in any
              way; or (ii) for fraudulent purposes, or in connection with a
              criminal offence or other unlawful activity, or (iii) to cause
              annoyance, inconvenience or anxiety or (iv) in any manner which
              may cause any loss to FuelBuddy Group.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You acknowledge and agree that if FuelBuddy disables access to
              your Account, for breach of the Terms or for any reasons
              whatsoever, you may be prevented, in the interim or permanently,
              from accessing the FuelBuddy Application, your account details or
              any files or other content, which is contained in your account.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              We reserve the right to refuse service, terminate accounts or
              remove or edit content if you are in breach of applicable law,
              these Terms or any other applicable terms and conditions,
              guidelines or policies that may apply.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              By using FuelBuddy Application, you hereby further undertake
              and/or state:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That you are above 18 years of age, and a major as per
              laws of India.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That the mobile/cell phone number used to register for
              the Account, belongs to you, and the mobile number required for
              the specific purpose of registering with FuelBuddy Application.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That the payment method used to pay, either belongs to
              you for the specific purpose of obtaining a Service.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} To pay all applicable charges including procurement,
              delivery-charges, surge-charges, handling-charges, and statutory
              and payment facilitation charges, including taxes, levies,
              charges, surcharges, cess, and fees that may be charged as
              applicable.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That you are acting on your own accord and you are
              willing to be bind yourself to all Terms, when using FuelBuddy
              Application and which Terms may be updated from time-to-time.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} To not assign or transfer the Account to any other
              third-person or entity.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} To comply with all applicable law.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That in certain instances you may be asked to provide
              proof-of-identity to access or use FuelBuddy Application for KYC
              purposes.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That all information that has been shared by you with
              FuelBuddy is factually correct and accurate.
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} That in case there are quality or quantity issues with
              the goods procured, you will direct all claims with the Associated
              Seller.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              6. USER GENERATED CONTENT
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You may post constructive reviews, and comments on FuelBuddy
              Application, send electronic communications to us and submit
              suggestions, ideas, comments, questions or other information
              (“User Generated Content”), as long as the User Generated Content
              is not illegal, obscene, abusive, threatening, defamatory,
              invasive of privacy, infringing of intellectual property rights,
              or otherwise injurious to third-parties or objectionable and does
              not consist of or contain software viruses, political campaigning,
              commercial solicitation, chain letters, mass mailings or any form
              of "spam". You may not use a false/anonymous e-mail address,
              impersonate any person or entity (unless you are given special
              rights under the Terms to administer accounts and perform tasks on
              behalf of another person or entity), or otherwise mislead as to
              the origin of the User Generated Content. We reserve the right to
              remove or edit such User Generated Content. If you believe that
              any User Generated Content posted by other users of FuelBuddy
              Application contains a defamatory statement, or that your
              intellectual property rights are being infringed by such User
              Generated Content, please notify FuelBuddy as soon as possible.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              If you post any User Generated Content on FuelBuddy Application,
              you grant FuelBuddy Group (a) a non-exclusive, royalty-free
              licence to use, reproduce, publish, make available, translate and
              modify such User Generated Content, including the moral rights
              associated with said content, throughout the world (including the
              right to sublicense these rights to third-parties); and (b) the
              right to use the name that you submit in connection with such User
              Generated Content.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You represent and warrant that you own or otherwise control all of
              the rights to the User Generated Content that you post; that, as
              on the date that the User Generated Content is posted: (i) the
              User Generated Content is accurate; and (ii) use of the User
              Generated Content you supply does not breach any applicable
              policies, laws or guidelines and will not cause injury to any
              person or entity (including that the content or material is not
              defamatory).
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree to indemnify, over and above what is contained in clause
              21, FuelBuddy Group and its affiliated companies for all claims
              brought by a third-party against FuelBuddy Group and/or its
              affiliated companies arising out of or in connection with the User
              Generated Content you supply to FuelBuddy Application or for any
              breach of the Terms.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree to use such User Generated Content at your sole risk and
              we shall not have any liability to you for content that may be
              found to be offensive, indecent, or objectionable, and we shall
              take all reasonable steps to remove such Content from the
              FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              For the avoidance of any doubt, any User Generated Content,
              whether publicly posted or privately transmitted, is the sole
              responsibility of the person or entity providing the User
              Generated Content, and FuelBuddy Group shall not be liable for any
              claims or losses arising from such User Generated Content.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              7. THIRD PARTY SERVICES AND MATERIALS
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy Application may contain or have embedded in itself,
              software, information, services and materials received from
              third-parties and/or or provide links to third party-websites not
              under FuelBuddy Group’s control (
              <Text size="xs" weight="normal">
                Third Party Materials
              </Text>
              ). Such Third Party Materials may be subject to restrictions and
              terms in addition to those set out in these Terms.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy Group may have formed partnerships or alliances with
              some third-parties from time-to-time in order to facilitate the
              Services to you. Nevertheless, you acknowledge and agree that at
              no time are we making any representation or warranty regarding any
              Third Party Materials nor will we be liable to you or any
              third-party for any consequences or claims arising from or in
              connection with such third-party including, and not limited to,
              any liability or responsibility for, death, injury or impairment
              experienced by you or any third-party. You hereby disclaim and
              waive any rights and claims you may have against us with respect
              to third-party's services/Third Party Materials.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree to comply with all such restrictions and terms and that
              any third-party shall have the right to enforce these Terms with
              respect to the use of the Third Party Materials owned and/or
              supplied by that third-party.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Further, FuelBuddy Application may contain Open Source Software
              that may be provided to you, under the terms of the open source
              license agreement or copyright notice accompanying such Open
              Source Software, each of which you agree to comply with. As used
              herein, the term “Open Source Software” means any software,
              program, module, code, library, database, driver or similar
              component (or portion thereof) that is royalty free, proprietary
              software, the use of which requires any contractual obligations by
              the User to a third-party or any license that has been approved by
              the Open Source Initiative, Free Software Foundation or any
              similar group.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You acknowledge and agree that we are not responsible for
              examining or evaluating the content, accuracy, completeness,
              timeliness, validity, copyright compliance, legality, decency,
              quality or any other aspect of such Third Party Materials.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree to use such Third Party Materials at your sole risk and
              we shall not have any liability to you for Third Party Materials
              that may be found to be inaccurate, misleading, offensive,
              indecent, or objectionable.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              WE DO NOT ENDORSE, WARRANT, ASSUME LIABILITY OR GUARANTEE ANY
              APPLICATION, PRODUCT, INFORMATION OR SERVICE OFFERED BY ANY THIRD
              PARTY (INCLUDING ANY ISV) THROUGH FUELBUDDY APPLICATION, AND WILL
              NOT BE A PARTY TO ANY TRANSACTION BETWEEN YOU AND ANY SUCH THIRD
              PARTY, EXCEPT, AND TO THE EXTENT, AS OTHERWISE STATED IN THESE
              TERMS.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Websites of third-parties may contain links to FuelBuddy
              Application and that we have no responsibility or liability for
              any material on such web sites. We reserve the right to disable
              any unauthorised links to FuelBuddy Application on any third-party
              website.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              8. CONFIDENTIAL INFORMATION
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Your information
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Except for the checkout pages, any account administration pages
              (including pages containing your leads, quotes, invoices and
              orders) and any other parts of FuelBuddy Application which are
              clearly identified as confidential or have restricted access (each
              a “Non-Public Forum”), FuelBuddy Application is intended to be a
              public forum and you agree not to provide us or other Users of
              FuelBuddy Application with any confidential or proprietary
              information, unless otherwise required for delivery of Service,
              that you or the owner of the information do not intend to become
              public information. Except for information inputted into the
              checkout or account administration pages of FuelBuddy Application
              or any content clearly labelled as confidential that you upload
              into a Non-Public Forum, any information and/or content that you
              send or upload to FuelBuddy Application (including but not limited
              to any article, information, data, text, image, video, photograph,
              message, review, or posting to any forum or blog (“Your Content”)
              will be deemed NOT to be confidential or proprietary, and you
              expressly agree that you waive any trade secret or other
              confidentiality rights with respect to Your Content.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              ALL UPLOADED INFORMATION OR CONTENT BY YOU INTO FUELBUDDY
              APPLICATION, WHETHER INTO A PUBLIC FORUM OR NON-PUBLIC FORUM,
              SHALL BE AT YOUR OWN RISK AND TO THE MAXIMUM EXTENT PERMITTED BY
              LAW FUELBUDDY GROUP TAKES NO RESPONSIBILITY FOR THE USE OR MISUSE
              OF ANY SUCH UPLOADED INFORMATION BY ANY OTHER USEROF FUELBUDDY
              APPLICATION.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Your access to confidential information
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree not to reproduce any Confidential Information to which
              you are provided access through FuelBuddy Application in any form
              except as authorised at the time of disclosure. Any reproduction
              of our Confidential Information shall remain our property and
              shall contain any and all confidential or proprietary notices or
              legends which appear on the original. You agree to:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Take all reasonable steps (defined below) to keep all
              Confidential Information strictly confidential;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} To use Confidential Information solely as authorised at
              the time of disclosure; and
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Not to disclose any Confidential Information to any
              party without our prior written consent.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You do not acquire any rights in Confidential Information except
              the limited rights as described above. In no event shall you use
              Confidential Information to create, enhance, modify, rent, lease,
              loan, sell, distribute or create derivative works based on the
              Applications or FuelBuddy Application, or compete with the
              Applications or FuelBuddy Application in whole or in part.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              For the purposes of these Terms,{' '}
              <Text size="xs" weight="bold">
                Confidential Information
              </Text>{' '}
              shall mean all information of a confidential or proprietary
              nature, including all trade secrets and other information which we
              or third parties protect against unrestricted disclosure to
              others, which is either labelled confidential, accessed through a
              restricted area of FuelBuddy Application or reasonably
              identifiable as confidential based on the type of information and
              the manner of its disclosure, and{' '}
              <Text size="xs" weight="bold">
                reasonable steps{' '}
              </Text>
              means those steps you and/or your Company take to protect your own
              similar Confidential Information, which shall not be less than a
              reasonable standard of care.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              9. PRIVACY AND DATA PROTECTION
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Personal information
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You understand that we collect, use, store and process your
              personal data (
              <Text size="xs" weight="bold">
                Personal Data
              </Text>
              ) in accordance with the terms of our Privacy Policy and you agree
              to comply with the Privacy Policy. Where you provide Personal
              Data, you warrant and represent that you have all necessary
              rights, authorities, consents and approvals required to transfer
              such Personal Data to us in accordance with all applicable data
              protection laws.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Our data use
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Use of the Personal Data shall be governed by Our Privacy Policy,
              in accordance with the provisions of Digital Personal Data
              Protection Act, 2023. You understand and agree that we (including
              the FuelBuddy Affiliates and third-party service providers)
              collect, use, store and otherwise process your data for the
              purposes of improving or providing Services associated with the
              FuelBuddy Application, gathering business insights, providing you
              with personalised content and suggesting other products and
              services that may be of interest to you, subject to the terms of
              our Privacy Policy. Please refer to our Privacy Policy as uploaded
              on our website.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              C. Payment information
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Where we through FuelBuddy Application, as per applicable RBI
              guidelines temporarily store your credit card and/or direct debit
              information provided by you for the purposes of processing the
              data provided on FuelBuddy Application and the Services rendered
              through it. The collection and processing of such information will
              be treated in compliance with our Privacy Policy and the
              applicable data protection law as stated in clause 9 (B).
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              D. Disclosure of information
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree that we may access, preserve and disclose your
              information and/or content (including any Personal Data, account
              information and User Generated Content) if required to do so by
              law or to:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Comply with a legal process;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Respond to claims that any content violates the rights
              of third parties;
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Protect the rights, our property or personal safety,
              users of FuelBuddy Application, and the public; or
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Enable FuelBuddy Application to process business
              transactions
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              E. Updating the Application
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy application may include functionality to automatically
              check for updates or upgrades to the application/software. Unless
              your device, its settings, or computer software does not permit
              transmission or use of upgrades or updates, you agree that
              FuelBuddy may provide notice to you of the availability of such
              upgrades or updates and automatically push such upgrade or update
              to your device or computer from time-to-time. You may be required
              to install certain upgrades or updates to the software in order to
              continue to access or use the Application, or portions thereof
              (including upgrades or updates designed to correct issues with the
              Services). Any updates or upgrades provided to you by us under the
              Terms shall be considered part of the Services.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              10. NETWORK ACCESS AND DEVICES
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The User is solely responsible for obtaining the data network
              access necessary to use FuelBuddy Application. The users
              mobile/cell network’s data and fees may apply, if the User
              accesses or uses FuelBuddy Application from a wireless-enabled
              device. The User is responsible for acquiring and updating
              compatible hardware or devices necessary to access and use the
              Application and any updates thereto.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              11. BUYERS/USERS
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Any User, regardless of buying any Service, solely at his own
              discretion, risk and responsibility may buy Services offered by
              the FuelBuddy Application, either under Pick up Model or Delivery
              Model. FuelBuddy does not make any recommendations nor gives any
              warranty (implied or express), guarantee or otherwise with respect
              to the quality, functionality, fitness for a particular purpose.
              FuelBuddy Application acts as an aggregator between the Authorised
              Seller and User for a product and/or service selling under any
              Model and shall not be liable for any quality or quantity, delay,
              non-delivery or for any cancellation of order placed by the User.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As a User, you may also book slots for charging your electric
              vehicles at designated outlets using the FuelBuddy Application.
              However, FuelBuddy is not responsible for non-availability of
              vacant slots for charging or quality of any product or service
              offered at the designated outlets. Products and/or services
              obtained via FuelBuddy Application are on as-is basis.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As a User, you acknowledge and agree that details available on the
              FuelBuddy Application is available for information purposes as
              well. You further acknowledge and agree that any information
              including actual price of any product and/or service may vary from
              the price shown on our FuelBuddy Application and therefore you
              shall alone, and not FuelBuddy, be responsible to pay for or for
              any such updated pricing, any additional cost, that may be
              incurred.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy may from time to time, launch certain
              offers/coupons/deals (
              <Text size="xs" weight="bold">
                Scheme
              </Text>
              ) for promotion of Application and User engagement. As a Buyer,
              you acknowledge and agree that you shall strictly abide by the
              terms and conditions of the Scheme, as applicable, which shall be
              in addition to this Terms.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              It is clarified that any Scheme provided by FuelBuddy Group,
              unless otherwise mentioned, shall not be clubbed or combined with
              any other schemes available on FuelBuddy Application. Further,
              FuelBuddy Group, depending upon the prevalent circumstance at a
              point in time, may suspend/cancel/vary the Scheme without any
              prior notice.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              When a User buys any Service after visiting the FuelBuddy
              Application, the User shall alone be responsible to complete the
              documentation part as per applicable laws and FuelBuddy shall not
              be responsible for any consequences (including without limitation
              delay in delivery of product, quality or quantity, cancellation of
              transaction, incomplete or improper documentation) whatsoever.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy strongly advises you not to test the FuelBuddy
              Application with false purchases request, as it may put you at
              substantial legal risk and which may also render delivery of its
              services to genuine Users. It shall be considered an illegal act
              to use a false name, or any manner of impersonation representing
              to test the FuelBuddy Application. Willfully providing erroneous
              or fictitious purchase request may result in prosecution by
              FuelBuddy Group and/or Associated Seller.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              12. ASSOCIATED SELLER:
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Pick up Model
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Associated Seller may list its products and/or services with
              description thereto for selling to the prospective Users, who are
              as registered users of the FuelBuddy Application. A User may place
              orders/make bookings, using FuelBuddy Application to Associated
              Sellers and may pick up the order from the Associated Seller, with
              which such booking is made.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Users understand that FuelBuddy Application acts as an
              intermediary for Users to allow them to purchase products and/or
              services from Associated Sellers.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy Group will take reasonable steps to ensure that there is
              no misrepresentation made by the Associated Seller while offering
              its products and services over the FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As an Associated Seller, you must be legally able to sell the
              products listed for sale on our FuelBuddy Application. Listings
              may only include text descriptions, graphics and pictures that
              describe your products/services for sale. All listed
              products/services must be listed in an appropriate category on the
              Application. All listed products must be kept in stock for
              successful fulfilment of sales/orders.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The listing description of the product must not be misleading and
              must describe actual condition of the products/services. If the
              products/services do not match the actual description listed on
              the Application, you agree to exchange or to refund any amounts
              that you may receive against the order placed by User, to
              FuelBuddy.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You shall not abuse or misuse the FuelBuddy Application or engage
              in any activity which violates the terms of this Terms. In any
              such case, FuelBuddy may suspend your Account or permanently debar
              you from accessing the Website.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As an Associated Seller, you certify that all information provided
              by you against your listed product is true.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Associated Seller must refrain from bribing/corrupting any of
              FuelBuddy employees or Buyer or User for undue benefit. Any such
              action will lead to suspension of Account in addition to
              prosecution under the applicable law. Associated Seller is alone
              responsible for completing and verification of the documentation
              part, before concluding the sale. Any sale concluded on the part
              of the Associated Seller, shall be the sole responsibility of the
              Associated Seller.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy reserves its right to screen the listing of
              products/services, as it may deem fit, before publishing the same
              on the FuelBuddy Application. This screening process is initiated
              from time-to-time to ensure the authenticity of the details posted
              by Associated Seller. This screening may take some time and
              therefore listing of product/service may be delayed. If at any
              time, at the sole discretion of FuelBuddy, FuelBuddy determines
              that the particulars of the products/services are misleading or
              not accurate, then FuelBuddy may remove such listing from the
              FuelBuddy Application and can further take appropriate actions
              against the Authorised Seller.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Delivery Model
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              User may choose for Doorstep Delivery of products and/or services
              under Delivery Model by placing an order directly to FuelBuddy
              Application, wherein FuelBuddy shall deliver the product to the
              User at the designated location of the User either through its own
              means or through its Delivery Partners and/or agents.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As a User, you shall acknowledge the terms of the any agreement,
              if any, executed separately with FuelBuddy in align with these
              Terms in order to procure the products and/or services under
              Delivery Model.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Further, upon placing orders/making bookings by User directly with
              FuelBuddy, FuelBuddy may arrange the delivery of the products to
              the designated location of User. Further, FuelBuddy may also
              purchase, on demand of User upon confirmed receipt of advance
              payment, required Services (including fuels from its selected oil
              company retailers/oil marketing company retailers) and deliver the
              same to the User to the designated location of the User.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              13. REPRESENTATION AND WARRANTIES
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy does not control and is not liable in respect of or
              responsible for the quality, safety, genuineness, lawfulness or
              availability of the Services offered for sale on its FuelBuddy
              Application or the ability of User(s) purchasing goods and/or
              services to complete a purchase. These Terms shall not be deemed
              to create any agreement, partnership, joint venture, or any other
              joint business relationship between FuelBuddy and the User or any
              other party. The fuels procured from Associated Sellers are
              procured by FuelBuddy on as-is basis and serviced as-is to the
              User.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy does not make any representation or Warranty as to
              specifics (such as quality, prescribed density of fuel, value,
              salability, etc.) of the Services proposed to be sold or offered
              to be sold or purchased on its FuelBuddy Application. FuelBuddy
              does not implicitly or explicitly support or endorse the sale or
              purchase Services on its FuelBuddy Application. FuelBuddy accepts
              no liability for any errors or omissions, whether on behalf of
              itself or third-parties.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy is not responsible for any non-performance or breach of
              any contract or obligations entered into between Users and
              Associated Sellers. FuelBuddy shall not be liable for any damages
              in case any order placed by the User is cancelled by any party for
              any reasons or non-fulfillment of any order placed on its
              FuelBuddy Application. FuelBuddy cannot and does not guarantee
              that the concerned Users and/or Associated Sellers will perform
              any transaction concluded on the FuelBuddy Application. However,
              FuelBuddy will make reasonable efforts to provide its Services.
              FuelBuddy shall not and is not required to mediate or resolve any
              dispute or disagreement between Users and Associated Sellers.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy does not at any point of time during any transaction
              made between User and Associated Seller on the FuelBuddy
              Application, and does not come into or take possession of any of
              the products/services offered by Associated Seller, nor does it at
              any point gain title to or have any rights or claims over the
              products and/or services offered by Associated Seller to User. At
              no point of time shall FuelBuddy hold any right, title or interest
              over the products and/or services, nor shall FuelBuddy have any
              obligations or liabilities in respect of such contract entered
              into between Users and Associated Sellers. FuelBuddy is not
              responsible for unsatisfactory or delayed performance of services
              or damages or delays towards any product.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The FuelBuddy Application is only a platform that can be utilized
              by Users to reach a larger base/network to avail products and/or
              services. User understands that FuelBuddy is only providing a
              platform for communication and it is understood that the contract
              for sale of any of the products or services shall be a strictly
              bipartite contract between the Associated Seller and the User.
              FuelBuddy is not responsible for unsatisfactory or delayed
              performance of services or damages or delays as a result of
              products and/or services which are out of stock, unavailable or
              back ordered.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You shall independently agree upon the manner and terms and
              conditions of delivery, payment, insurance etc. with the
              Authorised Seller(s) that you transact with via FuelBuddy
              Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy is not an oil company/ oil marketing company or retailer
              of any oil marketing company (or its agent/affiliate/subsidiary or
              in any other way are related to any oil company or oil marketing
              company operating in India or anywhere else in the world) and
              FuelBuddy does not endorse in explicit or implied form, any Oil
              Marketing Company or Oil Company operating in India or anywhere in
              the world.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              14. PAYMENT
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Pick Up Model:
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As a User, you have specifically authorized FuelBuddy or its
              affiliated service providers, if any, to collect, process,
              facilitate and remit payments and / or the transaction price
              electronically in respect of orders placed via FuelBuddy
              Application through payment modes provided, and where advance
              payment may also be collected for any future orders that may be
              placed. A User may choose a desired payment-mode to facilitate the
              completion of any order-transaction. Use of the desired payment
              mode shall not render FuelBuddy liable or responsible for the
              non-delivery, non-receipt, non-payment, damage, breach of
              representations and warranties, non-provision of after sales or
              warranty services or fraud as regards the Services listed on
              FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You understand, accept and agree that the payment wallet facility
              provided by FuelBuddy is neither a banking nor financial service
              but is merely a facilitator providing an electronic, automated
              online electronic payment, collection and remittance facility for
              the Order placed on the FuelBuddy Platform using the existing
              authorized banking infrastructure, Credit Card payment gateway
              networks, third party merchants and other payment gateways.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Delivery Model:
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Under Delivery Model, User may be liable to pay the Charges either
              by way of Bank Transfer or by UPI or any other mode of Payment,
              including but limited to scheduling transportation and
              transferring of Services procured from FuelBuddy, if applicable,
              to the specified and desired location of the User. The User will
              also be charged for applicable taxes. These Charges may be
              reflected in bill/ invoice issued in the name of User. All Charges
              are due immediately and payment will be facilitated by FuelBuddy
              using the preferred payment method designated to Account of the
              User, after which FuelBuddy will send the User a receipt by any
              mode as deemed fit. A delay in payment from the User from the due
              date of placing an order would attract a compensatory interest
              over and above the total invoice amount.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              As agreed between the User and FuelBuddy, FuelBuddy or Seller
              reserves the right to establish, remove and revise Charges for any
              or all services or goods (as applicable) obtain through use of the
              Services at any time in FuelBuddy sole discretion.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              15. General
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy may from time to time provide certain users with
              promotional offers and discounts that may result in different
              amount charge for the same or similar services or goods obtain
              through the use of the Services. The User acknowledges that part
              of the charges may be derived from benefits (including but not
              limited to reimbursements/paybacks/cashback/points/miles whether
              or not obtained when procuring product on behalf of the User
              and/or whether or not derived from use of cashless transaction
              and/or whether or not derived from using fleet cards/ fastags)
              which will be the sole property of FuelBuddy and the User hereby
              acknowledge and agrees that the User has no claim on any such
              benefits
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              In case of non-acceptance of order, the User agrees and undertakes
              that either FuelBuddy or Associated Seller is free to
              appropriately dispose the Service, as applicable, or use the
              Service as FuelBuddy may deem fit and further the User hereby
              relinquishes all claims on the Service ordered via FuelBuddy
              Application.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              While availing any of the payment method/s available on the
              Application, we will not be responsible or assume any liability,
              whatsoever in respect of any loss or damage arising directly or
              indirectly to You due to:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Lack of authorization for any transaction/s, or
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Exceeding the preset limit mutually agreed by You and
              between "Bank/s", or
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Any payment issues arising out of the transaction, or
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal" style={{marginLeft: 10}}>
              {'\u2B24'} Decline of transaction for any other reason/s
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              All payments made against the purchase of Services on FuelBuddy
              Application by you shall be compulsorily in Indian Rupees
              acceptable in the Republic of India. FuelBuddy Application will
              not facilitate transaction with respect to any other form of
              currency with respect to the purchases made on FuelBuddy
              Application.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              16. CUSTOMER REVIEWS
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                a.
              </Text>{' '}
              User reviews or ratings for products and/or services do not
              reflect the opinion of FuelBuddy. FuelBuddy receives multiple
              reviews or ratings for Services availed by Users, which reflect
              the opinions of the Users. Each and every review posted on
              FuelBuddy Application is the personal opinion/experience of the
              User only. FuelBuddy is a neutral platform, which solely provides
              a means of communication and platform between User and Associated
              Seller.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              <Text size="xs" weight="bold">
                b.
              </Text>{' '}
              FuelBuddy Application is a neutral platform and we don't arbitrate
              disputes.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              17. REFUND POLICY
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Unless, we otherwise agree with you in writing or any order
              cancelled by User prior to Delivery, as the case may be, the
              amount may be refunded to the User in the closed wallet maintained
              at FuelBuddy Application and shall be transferred to original mode
              of Payment as selected by the User, upon the request made to
              FuelBuddy and in no other event, you shall not be entitled to any
              refund or exchange as between you and us under any circumstances
              not contained in the present Terms.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              18. RIGHT TO REFUSE
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy is entitled to refuse to accept any Order without
              providing any reasons for the same. In case an order is refused,
              FuelBuddy will attempt to inform the user in a reasonable time
              period.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              19. ORDER BOOKING
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Pick Up Model:
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You may place an order by selecting the Services which you wish to
              buy, providing the required information and clicking on the “Pick
              Up” button (or similar) on FuelBuddy Application. We will
              acknowledge receipt of your order on the FuelBuddy Application and
              may send the confirmation via email/ SMS or by any mode as deemed
              fit.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Placement of order by a User with Associated Seller on the
              FuelBuddy Application shall not be construed as Associated
              Seller's acceptance of User’s request to buy the products ordered.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Delivery Model:
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You may place an Order by selecting the products which you wish to
              buy, providing the required information and clicking on the
              “Delivery” button (or similar) on FuelBuddy Application. We will
              acknowledge receipt of your Order on the Application and may send
              the confirmation via email/ SMS or by any mode
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              We will endeavor to fulfil our order as per the time slot choose
              by you on the FuelBuddy Application, unless there are exceptional
              circumstances. If we cannot fulfil your Order within a reasonable
              period, we will inform you on the Application or any other form or
              by contacting you directly after you place your Order.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              20. INTELLECTUAL PROPERTY RIGHTS
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Ownership, proprietary rights
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy Application is owned and operated by Treis Solutions
              LLP. The visual interfaces, graphics, design, compilation,
              information, computer code (including source code or object code),
              products, software, services, and all other elements of FuelBuddy
              Application (the{' '}
              <Text size="xs" weight="bold">
                Materials
              </Text>
              ) are protected by copyright, trade dress, patent, and trademark
              laws, international conventions, and all other relevant
              intellectual property and proprietary rights, and applicable laws.
              FuelBuddy retains all right, title and interest in and to the
              software as a service solution that is powered by it and that
              enables FuelBuddy Application. All Materials contained on
              FuelBuddy Application, except the Applications, including images
              thereof, are the property of FuelBuddy or FuelBuddy Affiliates
              and/or licensors. All trademarks, service marks, and trade names
              are proprietary to FuelBuddy or FuelBuddy Affiliates and/or
              licensors. You may not sell, license, distribute, copy, modify,
              reverse engineer, publicly perform or display, transmit, publish,
              edit, adapt, create derivative works from, or otherwise make
              unauthorised use of any of the Materials. We reserve all rights
              not expressly granted in these Terms.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Trademarks, disclaimer
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Our name, logo, and all product names of Applications provided on
              FuelBuddy Application are the trademarks and/or service marks
              owned by FuelBuddy or FuelBuddy Affiliates and/or licensors and no
              trademark or service mark or other license is granted to you in
              connection with the such trademarks and/or service marks.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              C. Proprietary rights, no license
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Nothing contained in these Terms shall be construed as conferring
              by implication, estoppel or otherwise any licence to any patent,
              trademark or other intellectual property right of FuelBuddy,
              FuelBuddy Affiliates and/or licensors, or any third party. We make
              no representations or warranties that any use of the information
              contained on FuelBuddy Application will not infringe any such
              patent, trademark or other intellectual property right of any
              third party.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              21. INDEMNITY
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              You agree to indemnify, defend, and hold FuelBuddy, its affiliated
              companies, contractors, employees, agents, licensors, and partners
              harmless from any claims, losses, damages, liabilities, including
              legal fees and expenses, arising out of your use or misuse of
              FuelBuddy Application or any Application, your violation of these
              Terms, or any breach of your representations, warranties, and
              covenants. We reserve the right, at your expense, to assume the
              exclusive defence and control of any matter for which you are
              required to indemnify us and you agree to cooperate with our
              defence of these claims. We will use reasonable efforts to notify
              you of any such claim, action, or proceeding upon becoming aware
              of it.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              22. EXCLUSION OF WARRANTIES
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              YOU EXPRESSLY AGREE THAT THE USE OF FUELBUDDY APPLICATION IS AT
              YOUR SOLE RISK. FUELBUDDY APPLICATION AND ANY DATA, INFORMATION,
              APPLICATIONS, REFERENCE SITES OR SERVICES MADE AVAILABLE IN
              CONJUNCTION WITH OR THROUGH FUELBUDDY APPLICATION ARE PROVIDED BY
              US AND FUELBUDDY AFFILIATES, PARTNERS AND LICENSORS (INCLUDING
              APPDIRECT) (
              <Text size="xs" weight="bold">
                FUELBUDDY APPLICATION PROVIDERS
              </Text>
              ) ON AN “AS IS” BASIS AND WITHOUT WARRANTIES OR REPRESENTATIONS OF
              ANY KIND EITHER EXPRESS OR IMPLIED. THE ENTIRE RISK ARISING OUT OF
              THE USE, PERFORMANCE OR NON-PERFORMANCE OF FUELBUDDY APPLICATION
              REMAINS WITH YOU. TO THE FULLEST EXTENT PERMISSIBLE PURSUANT TO
              APPLICABLE LAW, FUELBUDDY APPLICATION PROVIDERS DISCLAIM ALL
              REPRESENTATIONS OR WARRANTIES, STATUTORY, EXPRESS OR IMPLIED,
              INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT OF PROPRIETARY RIGHTS. FUELBUDDY APPLICATION
              PROVIDERS DO NOT WARRANT THAT THE DATA, FEATURES, FUNCTIONS, OR
              ANY OTHER INFORMATION OFFERED ON OR THROUGH FUELBUDDY APPLICATION
              OR ANY REFERENCE MATERIALS WILL BE UNINTERRUPTED, TIMELY,
              RELIABLE, LEGAL, COMPLETE, OPERABLE, AVAILABLE, ACCURATE, USEFUL,
              OR FREE OF ERRORS, VIRUSES OR OTHER HARMFUL COMPONENTS AND DO NOT
              WARRANT THAT ANY OF THE FOREGOING, IF ENCOUNTERED, WILL BE
              CORRECTED.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              FUELBUDDY APPLICATION PROVIDERS DO NOT WARRANT OR MAKE ANY
              REPRESENTATIONS IN RELATION TO ISVS OR ISV APPLICATIONS. ANY
              WARRANTY MADE REGARDING ANY ISV APPLICATION IS MADE DIRECTLY BY
              THE ISV. UNDER NO CIRCUMSTANCES WILL THE APPLICATION PROVIDERS BE
              LIABLE FOR ANY HARM RESULTING FROM DOWNLOADING OR ACCESSING ANY
              APPLICATION, ANY DELAY OR FAILURE IN PERFORMANCE RESULTING
              DIRECTLY OR INDIRECTLY FROM ACTS OF NATURE OR CAUSES BEYOND OUR
              REASONABLE CONTROL, INCLUDING INTERNET FAILURES, COMPUTER
              EQUIPMENT FAILURES, TELECOMMUNICATION EQUIPMENT FAILURES, OTHER
              EQUIPMENT FAILURES, ELECTRICAL POWER FAILURES, STRIKES, LABOR
              DISPUTES, RIOTS, INSURRECTIONS, CIVIL DISTURBANCES, SHORTAGES OF
              LABOR OR MATERIALS, FIRES, FLOODS, STORMS, EXPLOSIONS, ACTS OF
              GOD, WAR, GOVERNMENTAL ACTIONS, ORDERS OF DOMESTIC OR FOREIGN
              COURTS OR TRIBUNALS, OR NON-PERFORMANCE OF THIRD PARTIES.
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              CERTAIN JURISDICTIONS DO NOT ALLOW LIMITATIONS ON IMPLIED
              WARRANTIES. IF YOU RESIDE IN SUCH A JURISDICTION, SOME OR ALL OF
              THE ABOVE DISCLAIMERS AND LIMITATIONS MAY NOT APPLY TO YOU, AND
              YOU MAY HAVE ADDITIONAL RIGHTS. THE EXCLUSIONS OF WARRANTIES
              CONTAINED IN THESE TERMS APPLY TO YOU TO THE FULLEST EXTENT SUCH
              LIMITATIONS OR EXCLUSIONS ARE PERMITTED UNDER THE LAWS OF THE
              JURISDICTION WHERE YOU ARE LOCATED.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              23. LIMITATION OF LIABILITY
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Limitation of liability
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              UNDER NO CIRCUMSTANCES, INCLUDING, BUT NOT LIMITED TO, NEGLIGENCE,
              WILL FUELBUDDY APPLICATION PROVIDERS OR THEIR CONTRACTORS,
              EMPLOYEES, OFFICERS OR AGENTS BE LIABLE FOR ANY SPECIAL, INDIRECT,
              INCIDENTAL, CONSEQUENTIAL, PUNITIVE OR EXEMPLARY DAMAGES, LOST
              BUSINESS, LOST REVENUES OR LOSS OF ANTICIPATED PROFITS ARISING OUT
              OF OR RELATING TO THESE TERMS OR THAT RESULT FROM YOUR USE OR YOUR
              INABILITY TO USE THE MATERIALS, FUELBUDDY APPLICATION OR ANY
              APPLICATION, EVEN IF WE OR AN OUR AUTHORISED REPRESENTATIVE HAS
              BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. APPLICABLE LAW
              MAY NOT ALLOW THE LIMITATION OR EXCLUSION OF LIABILITY FOR
              INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATION OR
              EXCLUSION MAY NOT APPLY TO YOU. IN SUCH CASES, OUR LIABILITY WILL
              BE LIMITED TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Limitation of liability for end customers
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              IN NO EVENT WILL FUELBUDDY APPLICATION PROVIDERS OR THEIR
              CONTRACTORS, EMPLOYEES, OFFICERS OR AGENTS BE LIABLE FOR ANY
              DAMAGES SUFFERED BY ANY END CUSTOMER.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              C. Limitation of damages
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              NOTHING IN THESE TERMS EXCLUDES OR LIMITS THE LIABILITY OF
              FUELBUDDY OR FUELBUDDY APPLICATION OR THEIR CONTRACTORS,
              EMPLOYEES, OFFICERS OR AGENTS FOR DEATH OR PERSONAL INJURY CAUSED
              BY ITS NEGLIGENCE (OR THAT OF ITS EMPLOYEES, AGENTS OR DIRECTORS),
              OR OUR LIABILITY FOR FRAUD OR FRAUDULENT MISREPRESENTATION, OR ANY
              OTHER LIABILITY WHICH MAY NOT BE LIMITED OR EXCLUDED BY LAW.
            </Text>
            <Divider height={20} />
            <Text size="sm" weight="bold">
              24. GENERAL
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              A. Force majeure
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Any act outside our reasonable control, for example, acts of God,
              adverse weather conditions, strikes and industrial action and
              failure of our suppliers, etc shall be termed as Force majeure. We
              will not be liable or responsible for any failure to perform, or
              delay in performance of, any of our obligations under these Terms
              that is caused by such events. Our performance under these Terms
              will be suspended for the period of time over which the event
              occurs or their effect subsists, and we will have an extension of
              time for performance for the duration of that period of time. We
              will make reasonable efforts to find a solution to help us to
              perform these Terms wherever possible.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              B. Severability
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              If any provision of these Terms or any policies is held to be
              unlawful, void, or for any reason unenforceable, then that
              provision will be limited or eliminated from these Terms to the
              minimum extent necessary and will not affect the validity and
              enforceability of any remaining provisions. The provisions of the
              Terms set herein shall be read harmoniously, and not in derogation
              to each other.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              C. Waiver
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Our failure to exercise or enforce any right or provision of these
              Terms will not constitute a waiver of such right or provision. Any
              waiver of any provision of these Terms will be effective only if
              in writing and signed by us.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              D. Assignment
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              These Terms, and any rights and licenses granted under these
              Terms, may not be transferred or assigned by you under any
              circumstances, but may be assigned by us without restriction,
              including by operation of law, or in connection with merger, sale
              of stock, shares or assets, or change of control. Any assignment
              attempted to be made by you in violation of these Terms shall be
              void. Subject to the foregoing, these Terms shall bind and inure
              to the benefit of the parties and their respective successors and
              permitted assigns.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              E. Survival
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Upon termination of these Terms, any provision which, by its
              nature or express terms will survive such termination or
              expiration.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              F. Headings
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The heading references herein are for convenience purposes only,
              do not constitute a part of these Terms and will not be deemed to
              limit or affect any of the provisions of these Terms.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              G. Entire agreement
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              These Terms and any agreements or documents referred to in these
              Terms form the entire agreement between you and us with respect to
              the subject matter hereof and thereof and supersede in their
              entirety any and all oral or written agreements or understandings
              previously existing between you and us with respect to such
              subject matter.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              H. Independent contractor, no agency
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The relationship between you and us is one of independent
              contractors. No agency, partnership, joint venture,
              employee-employer or franchiser-franchisee relationship is
              intended, nor shall anything herein be interpreted or construed to
              or create, either expressly or by implication, any such
              relationship.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              I. Dispute Resolution Mechanism
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              The User agrees that any dispute, claim or controversy arising out
              of or relating to these Terms or the breach, terminated,
              enforcement, interpretation or validity thereof or the use of
              services (collectively, “Disputes”) will be first brought to the
              attention of FuelBuddy’s management in writing for amicable
              resolution. The Management, after scrutinizing the claim will
              endevour to reply to the User with a decision on the matter within
              a maximum period of 60 days. Such a decision, regardless of the
              address where the User is situated or where the services sought,
              if challenged by the User in respect of every matter so referred,
              shall be subject to exclusive jurisdiction of courts in the State
              of New Delhi.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              J. Redressal of Grievances
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              If a User has any questions or grievances regarding the
              Website/mobile application, the contents thereof or the Services,
              the User may reach out to FuelBuddy customer support at
              support@fuelbuddy.in (the “Grievance Officer”). The Grievance
              Officer shall address any complaint or grievance that is raised by
              a User within a period of one (1) month from when it is raised.
              Following are the details of Grievance officer:
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Name: Vadivel Nandhyalam
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Designation: CRC Head
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Email address: support @fuelbuddy.in
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Address: 249D, 01st Floor, ASF Towers, Udhyog Vihar, Phase-IV,
              Gurugram, Haryana
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Telephone no: 8088994444
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              K. Governing Law Jurisdiction
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              These Terms are governed by the provisions of laws of that country
              including any statutory amendments or modifications thereto. You
              consent to the jurisdiction and venue of the courts located in
              Delhi, India in connection with any action, suit, proceeding or
              claim arising under or by reason of this Terms.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              L. Notices
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              All notices given to a User by FuelBuddy or by a User to FuelBuddy
              shall be in writing and in the English language. Such notice shall
              be sent by e-mail or mailed by a prepaid
              internationally-recognized courier service to the intended
              recipient at the address set out below, or any changed address
              that is notified by either Party:
            </Text>
            <Divider height={16} />
            <Text size="xs" weight="normal">
              Notice to FuelBuddy:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal">
              Treis Solutions LLP, A-41, Mohan Cooperative Industrial Estate,
              Mathura Road,
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal">
              New Delhi-110044
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal">
              Email: support @fuelbuddy.in
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal">
              Notice to User:
            </Text>
            <Divider height={12} />
            <Text size="xs" weight="normal">
              At the email address provided by you at the time of registration
              on FuelBuddy Application.
            </Text>
            <Divider height={16} />
            <Text size="sm" weight="bold">
              M. Termination
            </Text>

            <Divider height={16} />
            <Text size="xs" weight="normal">
              FuelBuddy may terminate your access to FuelBuddy Application
              without any notice to you if it reasonably believes, in its sole
              discretion, that you have breached any of the Terms
            </Text>
          </Container>
        </ScrollViewIndicator>
      </View>
      {/* <IconButton @todo: find a workaround to show button while showing scrollbar
        variant="rounded"
        style={styles.buttonStyle}
        onPress={() => {
          atTop ? handleScrollToBottom() : handleScrollToTop();
        }}>
        <IconButton.Icon>
          <Icon
            name={atTop ? 'arrow-downward' : 'arrow-upward'}
            color={FBColorPalette.white}
            size={vs(16)}
          />
        </IconButton.Icon>
      </IconButton> */}
    </BottomSheetView>
  );
};

const styles = ScaledSheet.create({
  body: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  buttonStyle: {
    position: 'absolute',
    bottom: '10%',
    zIndex: 10,
    height: '45@ms',
    width: '45@ms',
    borderRadius: '30@ms',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: FBColorPalette.neutral, // IOS
    shadowOffset: {height: 2, width: 1}, // IOS
    shadowOpacity: 1, // IOS
    shadowRadius: 6, //IOS
    elevation: 10, // Android
    backgroundColor: FBColors.darkGray,
  },
});

export default TermsConditionsPrivacy;
