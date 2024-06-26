import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, Image, Alert, Modal, Dimensions, TextInput } from 'react-native';
import { UserBookingTabNavigationProp } from './NavigationTypes';
import { getBookingIds, getBookingIdsAll, getBookingDetail, getDeleteBooking, getBookingIdsDate } from '../api';
import {userDefault, BookingId, Bookings, Filters} from './Types';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

type UserBookingScreenProps = {
    navigation: UserBookingTabNavigationProp;
};

const fullWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height; 

const UserBooking: React.FC<UserBookingScreenProps> = ({navigation}) => {

    const [bookingIds, setBookingIds] = useState<BookingId[]>([]);
    const [bookingDetails, setBookingDetails] = useState<Bookings[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [deleteData, setDeleteData] = useState("Empty");
    
    const [checkInPickerShow, setCheckInPickerShow] = useState(false);
    const [checkOutPickerShow, setCheckOutPickerShow] = useState(false);
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [minPrice, setMinPrice] = useState(0.00);
    const [maxPrice, setMaxPrice] = useState(0.00);
    const [depositPaid, setDepositPaid] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const openModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const applyButton = async () => {
        console.log(minPrice, maxPrice, checkInDate, checkOutDate, depositPaid);
        const filterApplied: Filters = {
            minprice: minPrice,
            maxprice: maxPrice,
            depositpaid: depositPaid,
        }
        setModalVisible(false);
        const data = await fetchBookingIds(userDefault.firstname, userDefault.lastname, checkInDate, checkOutDate);
        await fetchBookingDetailsFilter(data, filterApplied);
        setDepositPaid(false); 
        setCheckInDate(''); 
        setCheckOutDate(''); 
        setMinPrice(0.00); 
        setMaxPrice(0.00);       
    };

    const showCheckInPicker = () => {
        setCheckInPickerShow(true);
    }
    
      const showCheckOutPicker = () => {
        setCheckOutPickerShow(true);
    }


    const renderBookingItem = ({ item }: { item: Bookings }) => {
        return (
            <View style={styles.bookingCard}>
                <Image source={require('../assets/premier_2_bedroom.jpg')} style={styles.image} />
                <View style={styles.bookingDetail}>
                    <Text style={styles.bookingTitle} numberOfLines={1} ellipsizeMode="tail">Booking ID: {item.bookingid}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">Check-In Date: {item.bookingdates.checkin}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">Check-Out Date: {item.bookingdates.checkout}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">Total Price: {item.totalprice}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">Deposit Paid: {item.depositpaid ? 'Yes' : 'No'}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail">Additional Needs: {item.additionalneeds}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteBookingConfirmation(item.bookingid) }>
                    <Ionicons name="trash-outline" size={16} color={'white'}></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('BookingDetails', { bookingid: item.bookingid })}>
                    <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
            </View>
        );
      };

    const deleteBookingConfirmation = (bookingId?: number) => {
        Alert.alert("Delete Confirmation", `Are you sure to delete this booking?`, [
            {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
              },
            { 
                text: "OK", 
                onPress: () => { if(bookingId) {
                    deleteBooking(bookingId);
                } 
            }}
        ],
        {cancelable: false}    
        );
    }

    const deleteBooking = async (bookingId?: number) => {
        try {
            await getDeleteBooking(bookingId!.toString());
            console.log(`BookingID ${bookingId} is deleted successfully`);
            Alert.alert("Delete Successful", `Booking ${bookingId} has been deleted successfully!`, [
                { text: "OK", onPress: () => console.log("OK Pressed") }
            ]);
            // Refresh the bookings list
            const updatedBookingDetails = bookingDetails.filter(booking => booking.bookingid !== bookingId);
            setBookingDetails(updatedBookingDetails);
        } catch(error) {
            console.error(`Error deleting booking for bookingID ${bookingId}:`, error);
            Alert.alert("Delete Error", `Unable to delete booking ${bookingId}. Please try again.`, [
                { text: "OK", onPress: () => console.log("OK Pressed") }
            ]);
        }
    };

    const fetchBookingDetails = async (bookingIds: BookingId[]) => {
        const detailsPromises = bookingIds.map((bookingId) =>
            getBookingDetail(bookingId.bookingid.toString())
        );
        const details = await Promise.all(detailsPromises);
        const combinedDetails = details.map((detail, index) => ({
            ...detail,
            bookingid: bookingIds[index].bookingid
        }));
        setBookingDetails(combinedDetails);
        console.log("Show Combined Detail: ", combinedDetails);
        return combinedDetails;
    };

    const fetchBookingDetailsFilter = async (bookingIds: BookingId[], filterApplied: Filters) => {
        const detailsPromises = bookingIds.map((bookingId) =>
            getBookingDetail(bookingId.bookingid.toString())
        );
        const details = await Promise.all(detailsPromises);
        const combinedDetails = details.map((detail, index) => ({
            ...detail,
            bookingid: bookingIds[index].bookingid
        }));
        console.log("Show Combined Detail: ", combinedDetails);
        setBookingDetails(combinedDetails);
        let filteredDetails = combinedDetails.filter(bookingDetails => {
            const priceCondition = (!filterApplied.minprice || bookingDetails.totalprice >= filterApplied.minprice) && (!filterApplied.maxprice || bookingDetails.totalprice <= filterApplied.maxprice);
            const depositCondition = filterApplied.depositpaid == null || bookingDetails.depositpaid == filterApplied.depositpaid;
            return priceCondition && depositCondition;
        });
        console.log("Show Combined Detail after sorting: ", filteredDetails);
        setBookingDetails(filteredDetails);
        return filteredDetails;
    };

    const fetchBookingIds = async (firstName: string, lastName: string, checkin: string, checkout: string) => {
        try {
            if(checkin=='' && checkout=='') {
                const data = await getBookingIds(firstName, lastName);
                setBookingIds(data);
                console.log("dataID: ", data);
                return data;
            } else if(checkin!='' || checkout!='') {
                if(checkin!='' && checkout=='') {
                    let dateQuery:string = "";  
                    dateQuery=`&checkin=${moment(checkin, 'DD MMMM YYYY').format('YYYY-MM-DD')}`;
                    console.log(dateQuery);
                    const data = await getBookingIdsDate(firstName, lastName, dateQuery);
                    setBookingIds(data);
                    console.log("dataID: ", data);
                    return data;
                } 
                if(checkin=='' && checkout!='') {
                    let dateQuery:string = "";  
                    dateQuery=`&checkout=${moment(checkout, 'DD MMMM YYYY').format('YYYY-MM-DD')}`;
                    console.log(dateQuery);
                    const data = await getBookingIdsDate(firstName, lastName, dateQuery);
                    setBookingIds(data);
                    console.log("dataID: ", data);
                    return data;
                }
                if(checkin!='' && checkout!='') {
                    let dateQuery:string = "";  
                    dateQuery=`&checkin=${moment(checkin, 'DD MMMM YYYY').format('YYYY-MM-DD')}&checkout=${moment(checkout, 'DD MMMM YYYY').format('YYYY-MM-DD')}`;
                    console.log(dateQuery);
                    const data = await getBookingIdsDate(firstName, lastName, dateQuery);
                    setBookingIds(data);
                    console.log("dataID: ", data);
                    return data;
                }
            }
        } catch (error) {
            console.error(`Error fetching booking ids for ${userDefault.firstname}:`, error);
        } 
    };

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
                const fetchPage = async () => {
                    try {
                    const data = await fetchBookingIds(userDefault.firstname, userDefault.lastname, '', '');
                    const data2 = await fetchBookingDetails(data);
                        console.log(data2);
                    } catch (error) {
                    console.error(`Error fetching booking ids for ${userDefault.firstname}:`, error);
                    } finally {
                        setIsLoading(false);
                    }
                };
            fetchPage();
        }, [])
      );




  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (

        <FlatList
            data={bookingDetails}
            keyExtractor={(item) => item.bookingid!.toString()}
            renderItem={renderBookingItem} 
            />
        )}

        <TouchableOpacity onPress={openModal} style={styles.filterButton}>
            <Text style={styles.filterButtonText}><Ionicons name="filter-circle-outline" size={18} color="black" />   Show Filters</Text>
        </TouchableOpacity>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>

                <Text style={styles.modalTitle}>Sorts and Filters</Text>

                <View>
                    <Text>{`  Price Range:-`}</Text>
                    <Text>  Min Price (RM):                    Max Price (RM):</Text>
                    
                </View>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Min Price (RM)"
                        keyboardType="numeric"
                        value={minPrice.toString()}
                        onChangeText={(text) => setMinPrice(text == '' ? 0.00 : parseFloat(text))}
                    />
                    <Text style={styles.dash}>-</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Max Price (RM)"
                        keyboardType="numeric"
                        value={maxPrice.toString()}
                        onChangeText={(text) => setMaxPrice(text == '' ? 0.00 : parseFloat(text))}
                    />
                    </View>

                    <View style={styles.datePickerRow}>
                        <TouchableOpacity style={styles.datePicker} onPress={showCheckInPicker}>
                            <Text style={styles.buttonText}><Ionicons name="calendar" size={16} color="black" />   {((checkInDate!='' ? checkInDate : "Select Check-In Date"))}</Text>
                        </TouchableOpacity>
                        {checkInPickerShow && ( 
                            <DateTimePicker
                            style={styles.dateTimePicker}
                            value={checkInDate ? moment(checkInDate, 'DD MMMM YYYY').toDate() : new Date()}
                            display="default"
                            mode="date"
                            onChange={(event, selectedDate) => {
                                setCheckInPickerShow(false);
                                const currentDate = selectedDate || checkInDate;
                                const abc = moment(currentDate).startOf('day').format('DD MMMM YYYY');
                                setCheckInDate(abc);
                            }}
                            />
                        )}

                        <TouchableOpacity style={styles.datePicker} onPress={showCheckOutPicker}>
                            <Text style={styles.buttonText}><Ionicons name="calendar" size={16} color="black" />   {((checkOutDate!='' ? checkOutDate : "Select Check-Out Date"))}</Text>
                        </TouchableOpacity>
                        {checkOutPickerShow && ( 
                            <DateTimePicker
                            style={styles.dateTimePicker}
                            value={checkOutDate ? moment(checkOutDate, 'DD MMMM YYYY').toDate() : new Date()}

                            display="default"
                            mode="date"
                            onChange={(event, selectedDate) => {
                                setCheckOutPickerShow(false);
                                const currentDate = selectedDate || checkOutDate;
                                const abc = moment(currentDate).startOf('day').format('DD MMMM YYYY');
                                setCheckOutDate(abc);
                            }}
                            />
                        )}
                    </View>

                    <View style={styles.toggleRow}>
                        <Text>Deposit Paid:</Text>
                        <TouchableOpacity
                            style={[styles.toggleButton, depositPaid === true ? styles.toggleButtonActive : null]}
                            onPress={() => setDepositPaid(true)}
                        >
                            <Text>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, depositPaid === false ? styles.toggleButtonActive : null]}
                            onPress={() => setDepositPaid(false)}
                        >
                            <Text>No</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => {setModalVisible(false); setDepositPaid(false); setCheckInDate(''); setCheckOutDate(''); setMinPrice(0.00); setMaxPrice(0.00); }}
                        >
                            <Text>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.applyButton]} onPress={applyButton}>
                            <Text>Apply</Text>
                        </TouchableOpacity>
                    </View>
                    
                </View>
            </View>
        </Modal>
    </View>
  )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    bookingCard: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        height: 230,
        backgroundColor:'#FFFFFF',
        borderRadius: 10,
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    bookingDetail: {
        flex: 0,
        top: -15,
    },
    bookingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    detailsButton: {
        backgroundColor: 'navy',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        position: 'absolute',
        alignSelf: 'flex-end',
        left: '75%',
        bottom: '7%',
    },
    detailsButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: 'navy',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        position: 'absolute',
        alignSelf: 'flex-end',
        left: '57%',
        bottom: '7%',
    },
    image: {
        width: 125,
        height: 180,
        borderRadius: 10,
        marginRight: 5,
        flex: 0,
    },
    filterButton: {
        padding: 10,
        backgroundColor: '#dbca70',
        borderRadius: 5,
      },
      modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)', 
      },
      modalContent: {
        height: screenHeight * 0.7, 
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
      },

      modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
      },
      inputRow: {
        flexDirection: 'row',
        marginBottom: 20,
      },
      input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginHorizontal: 5,
      },
      dash: {
        alignSelf: 'center',
      },
      datePickerRow: {
        flexDirection: 'row',
        marginBottom: 20,
      },
      datePicker: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginHorizontal: 5,
        alignItems: 'center',
      },
      toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
      },
      toggleButton: {
        borderWidth: 1,
        borderColor: '#007bff',
        padding: 10,
        marginHorizontal: 5,
      },
      toggleButtonActive: {
        backgroundColor: '#007bff',
      },
      buttonRow: {
        flexDirection: 'row',
        marginTop: 20,
      },
      button: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        alignItems: 'center',
      },
      cancelButton: {
        backgroundColor: '#ccc',
      },
      applyButton: {
        backgroundColor: '#007bff',
      },
      buttonText: {
        color: 'black',
      },
      filterButtonText: {
        color: 'black',
        fontWeight: 'bold',
      },
      dateTimePicker: {
        width: fullWidth,
      },
});

export default UserBooking;
