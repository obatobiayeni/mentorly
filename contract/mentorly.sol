// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Mentorly {
    uint256 private mentorsLength = 0;
    address private cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    /// @dev the maximum allowed discount is 50%
    uint256 private maxDiscount = 50;
    struct Mentor {
        address payable owner;
        string name;
        string expertise;
        string image;
        uint256 price;
        uint256 mentee;
    }

    mapping(uint256 => Mentor) private mentors;

    mapping(uint256 => bool) private exist;
    mapping(uint256 => bool) private onDiscount;
    mapping(uint256 => uint256) private discount;

    event Uploaded(address mentor, uint256 index);
    event Booked(uint256 index, uint256 amount);
    event Discount(uint256 index, uint256 amount, bool isDiscount);

    modifier exists(uint256 _index) {
        require(exist[_index], "Mentor doesn't exist");
        _;
    }

    modifier isNotOwner(uint256 _index) {
        require(mentors[_index].owner != msg.sender, "Invalid customer");
        _;
    }

    modifier isOwner(uint256 _index) {
        require(mentors[_index].owner == msg.sender, "Unauthorized user");
        _;
    }
    
    /// @dev allows a user to create a mentorship profile
    function uploadMentor(
        string memory _name,
        string memory _expertise,
        string memory _image,
        uint256 _price
    ) public {
        uint256 _mentee = 0;
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_expertise).length > 0, "Empty expertise");
        require(bytes(_image).length > 0, "Empty image url");
        uint256 index = mentorsLength;
        mentorsLength++;
        mentors[index] = Mentor(
            payable(msg.sender),
            _name,
            _expertise,
            _image,
            _price,
            _mentee
        );
        emit Uploaded(msg.sender, index);
    }

    function readMentors(uint256 _index)
        public
        view
        exists(_index)
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256
        )
    {
        return (
            mentors[_index].owner,
            mentors[_index].name,
            mentors[_index].expertise,
            mentors[_index].image,
            mentors[_index].price,
            mentors[_index].mentee
        );
    }

    function bookMentor(uint256 _index)
        external
        payable
        exists(_index)
        isNotOwner(_index)
    {
        uint256 total = onDiscount[_index]
            ? (discount[_index] / 100) * mentors[_index].price
            : mentors[_index].price;
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                mentors[_index].owner,
                total
            ),
            "Transfer failed."
        );
        mentors[_index].mentee++;
        emit Booked(_index, 1);
    }

    /// @dev allows users to book a mentor for many sessions
    /// @param amount is the amount of sessions
    function bookMentorInBulk(uint256 _index, uint256 amount)
        external
        payable
        exists(_index)
        isNotOwner(_index)
    {
        require(amount >= 2, "Amount is too low to book in bulk");
        uint256 total = onDiscount[_index]
            ? (discount[_index] / 100) * (mentors[_index].price * amount)
            : mentors[_index].price * amount;
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                mentors[_index].owner,
                total
            ),
            "Transfer failed."
        );
        mentors[_index].mentee += amount;
        emit Booked(_index, amount);
    }

    /// @dev allows a mentor to edit his price
    /// @param _price is the new price
    function editPrice(uint256 _index, uint256 _price)
        external
        exists(_index)
        isOwner(_index)
    {
        require(_price > 0, "Invalid price");
        mentors[_index].price = _price;
    }

    /// @dev allows mentors to enable discounts on booking
    /// @param _discount is the percentage of discount set
    function allowDiscounts(uint256 _index, uint256 _discount)
        external
        exists(_index)
        isOwner(_index)
    {
        require(!onDiscount[_index], "Discount already enabled");
        require(_discount > 0 && _discount <= maxDiscount, "Invalid discount percentage");
        onDiscount[_index] = true;
        discount[_index] = _discount;
        emit Discount(_index, _discount, onDiscount[_index]);
    }

    /// @dev allows mentors to disable and remove a previous discount set
    /// @notice the percentage discount is set back to zero
    function disableDiscounts(uint256 _index)
        external
        exists(_index)
        isOwner(_index)
    {
        require(onDiscount[_index], "Discount already disabled");
        onDiscount[_index] = false;
        discount[_index] = 0;
        emit Discount(_index, discount[_index], onDiscount[_index]);
    }

    function getMentorsLength() public view returns (uint256) {
        return (mentorsLength);
    }
}
